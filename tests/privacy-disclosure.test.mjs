import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const privacy = readFileSync(join(root, 'src/pages/privacy.astro'), 'utf8');
const jev = readFileSync(join(root, 'src/lib/crm/jev.ts'), 'utf8');

// The TypeSafe disclosure section only: from its heading to the next heading.
const sectionStart = privacy.indexOf('<h2>Automated inquiry triage</h2>');
const sectionEnd = privacy.indexOf('<h2>', sectionStart + 1);
const section = sectionStart >= 0 ? privacy.slice(sectionStart, sectionEnd > 0 ? sectionEnd : undefined) : '';

// Field labels exactly as stateOf writes them: `Name: ${...}`, `Location: ${...}`, ...
function stateOfFields() {
  const fn = jev.slice(jev.indexOf('function stateOf'), jev.indexOf('function questions'));
  return [...fn.matchAll(/`([A-Za-z ]+): \$\{/g)].map((m) => m[1]);
}

test('privacy policy discloses the TypeSafe AI triage step', () => {
  assert.ok(section, 'TypeSafe disclosure section is missing');
  assert.match(section, /TypeSafe AI/);
  assert.match(section, /api\.typesafe\.ai/);
});

test('disclosed message limit matches the code constant', () => {
  const limit = jev.match(/MESSAGE_LIMIT = (\d+)/);
  assert.ok(limit, 'MESSAGE_LIMIT not found in jev.ts');
  const disclosed = section.match(/first ([\d,]+)\s+characters/);
  assert.ok(disclosed, 'TypeSafe section does not state a character limit');
  assert.equal(Number(disclosed[1].replace(/,/g, '')), Number(limit[1]));
});

test('TypeSafe section discloses every field stateOf sends', () => {
  const fields = stateOfFields();
  assert.ok(fields.length >= 8, `expected 8 stateOf fields, found ${fields.length}: ${fields.join(', ')}`);
  const lower = section.toLowerCase();
  for (const field of fields) {
    const key = field.split(' ')[0].toLowerCase();
    assert.ok(lower.includes(key), `stateOf sends "${field}" but the TypeSafe section does not disclose it`);
  }
  // Name and page are sent even though the visitor never sees them as form fields.
  assert.ok(/name/.test(lower), 'TypeSafe section must disclose the name field');
  assert.ok(/page/.test(lower), 'TypeSafe section must disclose the page field');
});

test('disclosed behavior matches the code: no replies, no automatic rejection', () => {
  assert.match(section, /does not send\s+replies/i);
  assert.match(section, /does not automatically reject/i);
});

test('disabling triage is a server configuration, separate from Privacy choices', () => {
  assert.match(section, /server-side\s+configuration/i);
  assert.match(section, /separate from the Privacy choices/i);
  assert.match(section, /nothing is sent/i);
  // Without a key the code never calls the API and never blocks the inquiry.
  assert.match(jev, /if \(!key\) return null/);
});
