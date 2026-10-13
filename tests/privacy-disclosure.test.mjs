import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const privacy = readFileSync(join(root, 'src/pages/privacy.astro'), 'utf8');
const jev = readFileSync(join(root, 'src/lib/crm/jev.ts'), 'utf8');

test('privacy policy discloses the TypeSafe AI triage step', () => {
  assert.match(privacy, /TypeSafe AI/);
  assert.match(privacy, /api\.typesafe\.ai/);
  assert.match(privacy, /Automated inquiry triage/);
});

test('disclosed message limit matches the code constant', () => {
  const limit = jev.match(/MESSAGE_LIMIT = (\d+)/);
  assert.ok(limit, 'MESSAGE_LIMIT not found in jev.ts');
  const disclosed = privacy.match(/first ([\d,]+)\s+characters/);
  assert.ok(disclosed, 'privacy page does not state a character limit');
  assert.equal(Number(disclosed[1].replace(/,/g, '')), Number(limit[1]));
});

test('disclosed fields match what stateOf actually sends', () => {
  for (const field of ['Name', 'Location', 'Property', 'Service requested', 'Budget stated', 'Timeline stated', 'Message']) {
    assert.ok(jev.includes(`\`${field}`), `stateOf no longer sends ${field}`);
  }
  assert.match(privacy, /location, property type, service, budget and timeline/);
});

test('triage stays disabled without a key and never blocks the inquiry', () => {
  assert.match(jev, /if \(!key\) return null/);
  assert.match(privacy, /If triage is disabled, nothing is sent/);
});
