/** Offline UI regressions: execute the component's script with a stubbed tracking boundary. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { transform } from 'esbuild';

const source = await readFile(new URL('../src/components/GoogleConsent.astro', import.meta.url), 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
 .replace(/import \{([^}]+)\} from '\.\.\/lib\/google-tracking\/browser';/, 'const {$1} = boundary;');
const { code } = await transform(script, { loader: 'ts', target: 'es2022' });

function fixture({ choice = null, available = true, saveSucceeds = true, needsReload = false } = {}) {
 const elements = new Map();
 const document = { activeElement: null, querySelector: selector => elements.get(selector.slice(1)) ?? null };
 for (const [, , attributes, id] of source.matchAll(/<(\w+)\s+([^>]*\bid="(paula-consent-[^"]+)"[^>]*)>/g)) {
  const attrs = new Map([...attributes.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]));
  const listeners = new Map();
  const element = {
   hidden: /(?:^|\s)hidden(?:\s|$)/.test(attributes), checked: false, textContent: '',
   setAttribute: (name, value) => attrs.set(name, value), getAttribute: name => attrs.get(name),
   addEventListener: (name, listener) => listeners.set(name, listener),
   focus: () => { document.activeElement = element; },
   fire: (name, event = {}) => listeners.get(name)?.(event),
  };
  elements.set(id, element);
 }
 const saves = [];
 const events = [];
 let restoreCalls = 0;
 let reloadCalls = 0;
 const boundary = {
  savedConsent: () => choice,
  trackingAvailable: () => available,
  restoreConsent: () => { restoreCalls++; },
  trackGoogleEvent: event => events.push(event),
  reloadRecommended: () => needsReload,
  saveConsent: next => { saves.push({ ...next }); if (saveSucceeds) choice = { ...next }; return saveSucceeds; },
 };
 vm.runInNewContext(code, { document, boundary, location: { reload: () => { reloadCalls++; } } });
 const get = name => elements.get(`paula-consent-${name}`);
 return { get, click: name => get(name).fire('click'), document, saves, events,
  setChoice: next => { choice = next; }, getChoice: () => choice,
  restoreCalls: () => restoreCalls, reloadCalls: () => reloadCalls };
}

test('new visitors see three compact actions, unchecked options and no saved choice', () => {
 const x = fixture();
 assert.equal(x.get('root').hidden, false);
 assert.equal(x.get('panel').hidden, false);
 assert.equal(x.get('summary').hidden, false);
 assert.equal(x.get('preferences-panel').hidden, true);
 assert.equal(x.get('open').hidden, true);
 assert.equal(x.get('analytics').checked, false);
 assert.equal(x.get('ads').checked, false);
 assert.equal(x.saves.length, 0);
 assert.equal(x.restoreCalls(), 1);
 assert.equal(x.document.activeElement, null, 'first render must not steal focus from a form');
});

test('unavailable tracking keeps all consent UI inert', () => {
 const x = fixture({ available: false });
 assert.equal(x.get('root').hidden, true);
 assert.equal(x.get('panel').hidden, true);
 assert.equal(x.restoreCalls(), 0);
 assert.equal(x.events.length, 0);
 x.click('accept');
 assert.equal(x.saves.length, 0);
});

test('preferences exposes separate opt-ins and updates disclosure state without saving', () => {
 const x = fixture();
 x.click('preferences');
 assert.equal(x.get('summary').hidden, true);
 assert.equal(x.get('preferences-panel').hidden, false);
 assert.equal(x.get('preferences').getAttribute('aria-expanded'), 'true');
 assert.equal(x.get('preferences').getAttribute('aria-controls'), 'paula-consent-preferences-panel');
 assert.equal(x.document.activeElement, x.get('analytics'));
 assert.equal(x.get('analytics').checked, false);
 assert.equal(x.get('ads').checked, false);
 assert.equal(x.saves.length, 0);
});

test('accept and reject explicitly save both optional choices and return focus', () => {
 for (const [action, allowed] of [['accept', true], ['reject', false]]) {
  const x = fixture();
  x.click(action);
  assert.deepEqual(x.saves, [{ analytics: allowed, advertising: allowed }]);
  assert.equal(x.get('panel').hidden, true);
  assert.equal(x.get('open').hidden, false);
  assert.equal(x.get('open').getAttribute('aria-expanded'), 'false');
  assert.equal(x.document.activeElement, x.get('open'));
 }
});

test('save choices preserves independent analytics and advertising permissions', () => {
 for (const [analytics, advertising] of [[true, false], [false, true], [false, false]]) {
  const x = fixture();
  x.click('preferences');
  x.get('analytics').checked = analytics;
  x.get('ads').checked = advertising;
  x.click('save');
  assert.deepEqual(x.saves, [{ analytics, advertising }]);
  assert.equal(x.get('panel').hidden, true);
 }
});

test('Close discards unsaved choices and reopening goes straight to preferences', () => {
 const x = fixture();
 x.click('preferences');
 x.get('analytics').checked = true;
 x.get('ads').checked = true;
 x.click('close');
 assert.equal(x.saves.length, 0);
 assert.equal(x.getChoice(), null);
 assert.equal(x.document.activeElement, x.get('open'));
 x.click('open');
 assert.equal(x.get('panel').hidden, false);
 assert.equal(x.get('summary').hidden, true);
 assert.equal(x.get('preferences-panel').hidden, false);
 assert.equal(x.get('analytics').checked, false);
 assert.equal(x.get('ads').checked, false);
 assert.equal(x.get('open').getAttribute('aria-expanded'), 'true');
 assert.equal(x.get('open').getAttribute('aria-controls'), 'paula-consent-panel');
});

test('Escape closes either view without accepting, rejecting or reloading', () => {
 for (const preferences of [false, true]) {
  const x = fixture();
  if (preferences) x.click('preferences');
  x.get('analytics').checked = true;
  let prevented = false;
  x.get('panel').fire('keydown', { key: 'Escape', preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(x.get('panel').hidden, true);
  assert.equal(x.saves.length, 0);
  assert.equal(x.reloadCalls(), 0);
  assert.equal(x.document.activeElement, x.get('open'));
 }
});

test('stored consent stays collapsed and reopening reads the latest saved choices', () => {
 const x = fixture({ choice: { analytics: true, advertising: false } });
 assert.equal(x.get('panel').hidden, true);
 x.click('open');
 assert.equal(x.get('analytics').checked, true);
 assert.equal(x.get('ads').checked, false);
 x.get('ads').checked = true;
 x.click('close');
 assert.equal(x.get('ads').checked, false);
 x.setChoice({ analytics: false, advertising: true });
 x.click('open');
 assert.equal(x.get('analytics').checked, false);
 assert.equal(x.get('ads').checked, true);
 assert.equal(x.saves.length, 0);
 assert.equal(x.events.length, 1, 'reopening must not emit another page view');
});

test('withdrawal keeps the page and form in place until the explicit reload action', () => {
 const x = fixture({ choice: { analytics: true, advertising: true }, needsReload: true });
 x.click('open');
 x.get('analytics').checked = false;
 x.get('ads').checked = false;
 x.click('save');
 assert.deepEqual(x.saves, [{ analytics: false, advertising: false }]);
 assert.equal(x.get('panel').hidden, false);
 assert.equal(x.get('reload').hidden, false);
 assert.match(x.get('status').textContent, /Reduced permissions saved/);
 assert.equal(x.reloadCalls(), 0);
 x.click('close');
 x.click('open');
 assert.equal(x.get('reload').hidden, false);
 assert.equal(x.get('analytics').checked, false);
 x.click('reload');
 assert.equal(x.reloadCalls(), 1);
});

test('failed persistence remains visible and reports the fail-closed state', () => {
 const x = fixture({ saveSucceeds: false });
 x.click('accept');
 assert.equal(x.getChoice(), null);
 assert.equal(x.get('panel').hidden, false);
 assert.match(x.get('status').textContent, /could not be saved/);
 assert.match(x.get('status').textContent, /events are paused/);
 assert.equal(x.reloadCalls(), 0);
 assert.equal(x.events.length, 1, 'failed saving must not trigger another page view');
 x.click('preferences');
 assert.equal(x.get('analytics').checked, false);
 assert.equal(x.get('ads').checked, false);
});
