/** Browser bootstrap tested with a fake SDK and DOM; no network or form submission. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function compiled(enabled = 'true') {
 const result = await build({ entryPoints: [new URL('../src/lib/openai-pixel/browser.ts', import.meta.url).pathname],
  bundle: true, write: false, format: 'cjs', target: 'es2022',
  define: { 'import.meta.env.PUBLIC_OPENAI_PIXEL_ENABLED': JSON.stringify(enabled) } });
 return result.outputFiles[0].text;
}
const code = await compiled();
async function compiledBridge(googleEnabled = 'true', pixelEnabled = 'true') {
 const result = await build({ stdin: {
  contents: `export * from './src/lib/google-tracking/browser'; export * from './src/lib/openai-pixel/browser';`,
  resolveDir: new URL('..', import.meta.url).pathname,
 }, bundle: true, write: false, format: 'cjs', target: 'es2022',
 define: { 'import.meta.env.PUBLIC_GOOGLE_TRACKING_ENABLED': JSON.stringify(googleEnabled),
  'import.meta.env.PUBLIC_OPENAI_PIXEL_ENABLED': JSON.stringify(pixelEnabled) } });
 return result.outputFiles[0].text;
}
function fixture({ advertising = null, hostname = 'www.paulaambrosio.com', pathname = '/contact/',
 storageThrows = false, storageWriteThrows = false, foreign = false, source = code, session = new Map() } = {}) {
 let now = 1802000000000;
 let raw = advertising === null ? null : JSON.stringify({ version: 1, at: now, analytics: true, advertising });
 const listeners = new Map(); const scripts = new Map(); const timers = new Map();
 const cookieWrites = []; const loads = []; const vendorCalls = [];
 const addEventListener = (name, fn) => { listeners.set(name, [...(listeners.get(name) ?? []), fn]); };
 const fire = (name, data = {}) => { for (const listener of listeners.get(name) ?? []) listener(data); };
 const window = { addEventListener, dispatchEvent(event) { fire(event.type, event); } };
 if (foreign) window.oaiq = () => { throw new Error('Foreign pixel must not be used'); };
 const document = {
  addEventListener,
  getElementById: id => scripts.get(id),
  createElement: tag => {
   assert.equal(tag, 'script');
   const script = { remove() { scripts.delete(script.id); } };
   return script;
  },
  head: { append(script) { loads.push(script); scripts.set(script.id, script); } },
  get cookie() { return ''; },
  set cookie(value) { cookieWrites.push(value); },
 };
 const module = { exports: {} };
 vm.runInNewContext(source, { module, exports: module.exports, window, document,
  location: { hostname, pathname }, Date: { now: () => now },
  Event: class { constructor(type) { this.type = type; } }, queueMicrotask() {},
  sessionStorage: { getItem: key => session.get(key) ?? null, setItem: (key, value) => session.set(key, value), removeItem: key => session.delete(key) },
  localStorage: {
   getItem() { if (storageThrows) throw Error('denied'); return raw; },
   setItem(key, value) { if (storageWriteThrows) throw Error('write denied'); raw = value; },
   removeItem() { if (storageWriteThrows) throw Error('delete denied'); raw = null; },
  },
  setTimeout(fn, delay) { assert.ok(delay > 0 && delay < 2 ** 31); const id = Symbol(); timers.set(id, fn); return id; },
  clearTimeout(id) { timers.delete(id); },
 });
 const install = module.exports.installOpenAIBasePixel;
 install();
 return { window, loads, cookieWrites, vendorCalls, scripts, install, browser: module.exports, fire,
  setChoice(value) { raw = value === null ? null : JSON.stringify({ version: 1, at: now, analytics: true, advertising: value }); },
  expire() { now += 91 * 86400000; for (const fn of [...timers.values()]) fn(); },
  setStorageFailure() { storageThrows = true; },
  setStorageWriteFailure(value = true) { storageWriteThrows = value; },
  sdkReady() {
   const queued = window.oaiq.q; vendorCalls.push(...queued);
   window.oaiq = (...args) => { vendorCalls.push(args); };
   loads.find(script => script.id === 'paula-openai-pixel').onload();
  },
 };
}
function commands(x) { return JSON.parse(JSON.stringify(x.window.oaiq?.q ?? x.vendorCalls)); }

test('no choice, denial, analytics-only and storage failure never load the SDK', () => {
 for (const config of [{}, { advertising: false }, { advertising: true, storageThrows: true }]) {
  const x = fixture(config); x.fire('pageshow'); x.install();
  assert.equal(x.loads.length, 0); assert.equal(x.window.oaiq, undefined);
 }
});
test('advertising consent initializes once, deny first, production debug false, minimal data', () => {
 const x = fixture({ advertising: true }); x.install(); x.fire('pageshow'); x.fire('paula:consent-change');
 assert.equal(x.loads.length, 1);
 assert.equal(x.loads[0].referrerPolicy, 'origin');
 assert.equal(x.loads[0].src, 'https://bzrcdn.openai.com/sdk/oaiq.min.js');
 assert.deepEqual(commands(x), [['consent', false],
  ['init', { pixelId: 'DLYetutJXaTeayWo2pLYiF', debug: false }], ['consent', true]]);
 x.sdkReady(); x.fire('pageshow');
 assert.equal(x.vendorCalls.filter(([name]) => name === 'init').length, 1);
 assert.equal(x.vendorCalls.some(([name]) => name === 'measure'), false);
});
test('grant after initial denial loads only at the preference change', () => {
 const x = fixture(); assert.equal(x.loads.length, 0);
 x.setChoice(true); x.fire('paula:consent-change'); assert.equal(x.loads.length, 1);
});
test('revocation during download destroys stale grants and requires reload', () => {
 const x = fixture({ advertising: true }); x.setChoice(false); x.fire('paula:consent-change');
 assert.equal(x.scripts.size, 0);
 assert.ok(commands(x).every(args => args[0] === 'consent' && args[1] === false));
 x.setChoice(true); x.fire('paula:consent-change'); assert.equal(x.loads.length, 1);
 assert.ok(x.cookieWrites.some(value => value.startsWith('__oppref=; Max-Age=0')));
 assert.ok(x.cookieWrites.some(value => value.startsWith('__obref=; Max-Age=0')));
});
test('loaded SDK gets denial on revocation, missing storage, expiry and other-tab rejection', () => {
 for (const trigger of ['revoke', 'storage', 'expire', 'error']) {
  const x = fixture({ advertising: true }); x.sdkReady();
  if (trigger === 'expire') x.expire();
  else if (trigger === 'error') { x.setStorageFailure(); x.fire('visibilitychange'); }
  else { x.setChoice(false); x.fire(trigger === 'storage' ? 'storage' : 'paula:consent-change', { key: 'paula_optional_consent_v1' }); }
  assert.deepEqual(x.vendorCalls.at(-1), ['consent', false]);
  assert.equal(x.cookieWrites.length, 6);
 }
});
test('SDK error fails closed and no queued grant survives', () => {
 const x = fixture({ advertising: true }); x.loads[0].onerror(); x.fire('pageshow');
 assert.equal(x.loads.length, 1); assert.equal(x.scripts.size, 0);
 assert.ok(commands(x).every(args => args[1] === false));
});
test('previews, private routes, kill switch and a foreign SDK do not initialize', async () => {
 for (const options of [{ hostname: 'preview.vercel.app' }, { hostname: 'localhost' },
  { pathname: '/admin/' }, { pathname: '/api/contact/' }, { pathname: '/style-guides-and-branding/' },
  { foreign: true }, { source: await compiled('false') }]) {
  const x = fixture({ advertising: true, ...options }); assert.equal(x.loads.length, 0);
 }
});
test('only the public form connects server receipts; CRM never sends Pixel events', async () => {
 for (const path of ['../src/pages/api/contact.ts', '../src/lib/crm/store.ts']) {
  assert.doesNotMatch(await readFile(new URL(path, import.meta.url), 'utf8'), /openai-pixel|lead_created|\boaiq\b/);
 }
 const layout = await readFile(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');
 assert.equal((layout.match(/<OpenAIPixel\s*\/>/g) ?? []).length, 1);
});

test('failed preference writes deny an existing Pixel grant even when the old grant remains readable', async () => {
 for (const googleEnabled of ['true', 'false']) {
  const source = await compiledBridge(googleEnabled);
  for (const ready of [false, true]) {
   const x = fixture({ advertising: true, source });
   if (ready) x.sdkReady();
   x.setStorageWriteFailure();
   assert.equal(x.browser.saveConsent({ analytics: false, advertising: false }), false);
   assert.equal(x.browser.savedConsent()?.advertising, true, 'old storage grant is still readable');
   assert.deepEqual(commands(x).at(-1), ['consent', false]);
   if (!ready) assert.ok(commands(x).every(([command, value]) => command === 'consent' && value === false));
   assert.equal(x.browser.reloadRecommended(), true);
   assert.ok(x.cookieWrites.some(value => value.startsWith('__oppref=; Max-Age=0')));
   const before = JSON.stringify(commands(x));
   for (const name of ['pageshow', 'visibilitychange', 'paula:consent-change']) x.fire(name);
   assert.equal(JSON.stringify(commands(x)), before, 'stale grant cannot resume the Pixel');
   x.setStorageWriteFailure(false);
   assert.equal(x.browser.saveConsent({ analytics: true, advertising: true }), true);
   assert.equal(JSON.stringify(commands(x)), before, 'a new grant still requires a fresh document');
   assert.equal(x.loads.filter(script => script.id === 'paula-openai-pixel').length, 1);
  }
 }
});

test('explicit failed-save denial is latched even before Pixel initialization', async () => {
 const x = fixture({ source: await compiledBridge('false') });
 x.setStorageWriteFailure();
 assert.equal(x.browser.saveConsent({ analytics: false, advertising: false }), false);
 x.setChoice(true);
 for (const name of ['pageshow', 'visibilitychange', 'paula:consent-change']) x.fire(name);
 assert.equal(x.loads.length, 0);
 assert.equal(x.browser.reloadRecommended(), true);
});

test('Pixel-only configuration retains consent UI availability and withdrawal reload advice', async () => {
 const x = fixture({ advertising: true, source: await compiledBridge('false') });
 assert.equal(x.browser.trackingAvailable(), true);
 assert.equal(x.browser.reloadRecommended(), false);
 assert.equal(x.loads.length, 1);
 assert.equal(x.loads[0].id, 'paula-openai-pixel');
 x.sdkReady();
 assert.equal(x.browser.saveConsent({ analytics: false, advertising: false }), true);
 assert.deepEqual(commands(x).at(-1), ['consent', false]);
 assert.equal(x.browser.reloadRecommended(), true);
 assert.equal(x.loads.some(script => script.id === 'paula-google-container'), false);
 const disabled = fixture({ source: await compiledBridge('false', 'false') });
 assert.equal(disabled.browser.trackingAvailable(), false);

 const component = await readFile(new URL('../src/components/GoogleConsent.astro', import.meta.url), 'utf8');
 const frontmatter = component.split('---')[1];
 assert.match(component, /\{configured && \(/);
 for (const [googleEnabled, pixelEnabled, expected] of [['false', 'true', true], ['false', 'false', false], ['true', 'false', true]]) {
  const { outputFiles } = await build({ stdin: { contents: `${frontmatter}\nexport { configured };`,
   resolveDir: new URL('../src/components/', import.meta.url).pathname }, bundle: true, write: false,
   format: 'cjs', define: { 'import.meta.env.PUBLIC_GOOGLE_TRACKING_ENABLED': JSON.stringify(googleEnabled),
    'import.meta.env.PUBLIC_OPENAI_PIXEL_ENABLED': JSON.stringify(pixelEnabled) } });
  const module = { exports: {} };
  vm.runInNewContext(outputFiles[0].text, { module, exports: module.exports });
  assert.equal(module.exports.configured, expected, `consent markup with Google=${googleEnabled}, Pixel=${pixelEnabled}`);
 }
});


test('all three advertising landings include the same consent-gated base bootstrap once', async () => {
 for (const page of ['change-order', 'host-up', 'layout-starter-kit']) {
  const source = await readFile(new URL(`../src/pages/${page}.astro`, import.meta.url), 'utf8');
  assert.equal((source.match(/<OpenAIPixel\s*\/>/g) ?? []).length, 1);
  assert.match(source, /<head><OpenAIPixel \/>/);
  assert.match(source, /<GoogleConsent \/>/);
 }
});


const acceptance = { version: 1, eventId: '934b02bd-40fb-4ff1-836f-8f2f390c1077' };
const measurements = x => x.vendorCalls.filter(([name]) => name === 'measure');
test('accepted lead emits only minimal standard event, opaque ID and personalization opt-out', () => {
 const x = fixture({ advertising: true }); x.sdkReady();
 assert.equal(x.browser.measureAcceptedLead({ ...acceptance, email: 'private@example.test', message: 'secret', budget: 'private' }), true);
 assert.deepEqual(JSON.parse(JSON.stringify(measurements(x))), [
  ['measure', 'lead_created', { type: 'customer_action' }, { event_id: acceptance.eventId, opt_out: true }],
 ]);
 assert.equal(x.browser.measureAcceptedLead(acceptance), false);
 assert.equal(measurements(x).length, 1);
});
test('HTTP success, generic form_success, malformed and absent receipts cannot measure', () => {
 const x = fixture({ advertising: true }); x.sdkReady();
 for (const value of [null, {}, {ok:true}, {event:'form_success'}, {eventId:acceptance.eventId},
  {version:1,eventId:'private@example.test'}, {version:2,eventId:acceptance.eventId}]) {
  assert.equal(x.browser.measureAcceptedLead(value), false);
 }
 assert.equal(measurements(x).length, 0);
});
test('absent and denied measurement consent neither sends nor replays later', () => {
 for (const advertising of [null, false]) {
  const x = fixture({ advertising });
  assert.equal(x.browser.measureAcceptedLead(acceptance), false);
  assert.equal(x.loads.length, 0);
  x.setChoice(true); x.fire('paula:consent-change'); x.sdkReady();
  assert.equal(measurements(x).length, 0);
 }
});
test('receipt waits for the SDK once and is dropped if consent is revoked before load', () => {
 const x = fixture({ advertising: true });
 assert.equal(x.browser.measureAcceptedLead(acceptance), true);
 assert.equal(x.browser.measureAcceptedLead(acceptance), false);
 x.sdkReady(); assert.equal(measurements(x).length, 1);
 const y = fixture({ advertising: true });
 y.browser.measureAcceptedLead(acceptance);
 const pendingScript = y.loads[0]; y.setChoice(false); y.fire('paula:consent-change');
 // A removed script can still finish executing. Its late load callback must be harmless.
 y.window.oaiq = (...args) => y.vendorCalls.push(args); pendingScript.onload();
 assert.equal(measurements(y).length, 0);
});
test('consent is checked again when the receipt arrives, including expiry and storage failures', () => {
 for (const mode of ['withdrawn', 'expired', 'unreadable', 'failed-save']) {
  const x = fixture({ advertising: true }); x.sdkReady();
  if (mode === 'withdrawn') x.setChoice(false);
  if (mode === 'expired') x.expire();
  if (mode === 'unreadable') x.setStorageFailure();
  if (mode === 'failed-save') x.fire('paula:consent-denied');
  assert.equal(x.browser.measureAcceptedLead(acceptance), false);
  assert.equal(measurements(x).length, 0);
 }
});
test('opaque session receipt IDs suppress replay after reload without storing form data', () => {
 const session = new Map();
 const x = fixture({ advertising: true, session }); x.sdkReady(); x.browser.measureAcceptedLead(acceptance);
 assert.deepEqual(JSON.parse(session.get('paula_openai_measured_v1')), [acceptance.eventId]);
 const y = fixture({ advertising: true, session }); y.sdkReady();
 assert.equal(y.browser.measureAcceptedLead(acceptance), false);
 assert.equal(measurements(y).length, 0);
 y.setChoice(false); y.fire('paula:consent-change');
 assert.equal(session.has('paula_openai_measured_v1'), false);
});

test('a denied fresh document clears opaque receipt history left by an earlier granted page', () => {
 const session = new Map([['paula_openai_measured_v1', JSON.stringify([acceptance.eventId])]]);
 const x = fixture({advertising:false,session});
 assert.equal(session.size,0);
 assert.equal(x.loads.length,0);
 x.setChoice(true); x.fire('paula:consent-change');
 assert.equal(x.loads.length,1,'initial denial must not latch a later voluntary grant');
});
