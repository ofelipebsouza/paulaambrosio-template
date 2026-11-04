import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { build } from 'esbuild';

const bundle = (await build({ entryPoints: ['src/lib/meta-pixel/browser.ts'], bundle: true, write: false, format: 'iife', globalName: 'MetaPixel', platform: 'browser' })).outputFiles[0].text;
function fixture({ consent = null, hostname = 'www.paulaambrosio.com', pathname = '/', now = 1800000000000 } = {}) {
 const listeners = {}; const scripts = new Map(); const timers = new Map(); let raw = consent;
 const window = { addEventListener: (n, f) => (listeners[n] ??= []).push(f) };
 const document = { getElementById: id => scripts.get(id), createElement: () => ({ remove() { scripts.delete(this.id); } }), head: { append(s) { scripts.set(s.id, s); } } };
 const context = { window, document, location: { hostname, pathname }, Date: { now: () => now }, setTimeout: (fn) => { const id = Symbol(); timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id), localStorage: { getItem: () => raw, setItem: (_, v) => { raw = v; }, removeItem: () => { raw = null; } }, console };
 vm.runInNewContext(bundle, context);
 return { context, scripts, timers, fire: n => (listeners[n] ?? []).forEach(fn => fn()), install: () => context.MetaPixel.installMetaPixel(), setConsent: v => { raw = v; } };
}
const granted = JSON.stringify({ version: 1, at: 1800000000000, analytics: false, advertising: true });

test('no consent, analytics-only, expired and excluded routes do not load Meta', () => {
 for (const f of [fixture(), fixture({ consent: JSON.stringify({ version: 1, at: 1800000000000, analytics: true, advertising: false }) }), fixture({ consent: granted, hostname: 'preview.vercel.app' }), fixture({ consent: granted, pathname: '/admin/' })]) { f.install(); assert.equal(f.scripts.size, 0); }
});
test('affirmative consent queues grant, autoConfig, init and one PageView without a blocking revoke', () => {
 const f = fixture({ consent: granted }); f.install(); f.fire('pageshow'); f.fire('paula:consent-change'); assert.equal(f.scripts.size, 1); assert.equal(f.context.window.fbq.push, f.context.window.fbq); assert.equal(f.context.window._fbq, f.context.window.fbq); assert.deepEqual(JSON.parse(JSON.stringify(f.context.window.fbq.queue)), [['consent', 'grant'], ['set', 'autoConfig', false, '577841214418796'], ['init', '577841214418796'], ['track', 'PageView']]);
});
test('revocation clears delayed queue and is terminal across reacceptance', () => {
 const f = fixture({ consent: granted }); f.install(); f.setConsent(JSON.stringify({ version: 1, at: 1800000000000, analytics: false, advertising: false })); f.fire('paula:consent-denied'); assert.deepEqual(JSON.parse(JSON.stringify(f.context.window.fbq.queue)), [['consent', 'revoke']]); f.setConsent(granted); f.fire('paula:consent-change'); assert.equal(f.scripts.size, 0);
});

test('checkout targets only the owned pixel and rechecks consent at action time', () => {
 const f = fixture({ consent: granted }); f.install();
 assert.equal(f.context.MetaPixel.trackMetaCheckout(), true);
 assert.deepEqual(JSON.parse(JSON.stringify(f.context.window.fbq.queue.at(-1))), ['trackSingle', '577841214418796', 'InitiateCheckout']);
 f.setConsent(null);
 assert.equal(f.context.MetaPixel.trackMetaCheckout(), false);
 f.setConsent(granted); f.fire('pageshow');
 assert.equal(f.context.MetaPixel.trackMetaCheckout(), false);
});
test('foreign queues, replaced ownership, failed SDK and explicit denial fail closed', () => {
 const foreign = fixture({ consent: granted }); foreign.context.window.fbq = () => {}; foreign.install();
 assert.equal(foreign.scripts.size, 0); assert.equal(foreign.context.MetaPixel.trackMetaCheckout(), false);
 const replaced = fixture({ consent: granted }); replaced.install(); replaced.context.window._fbq = () => {};
 assert.equal(replaced.context.MetaPixel.trackMetaCheckout(), false);
 const failed = fixture({ consent: granted }); failed.install(); [...failed.scripts.values()][0].onerror();
 assert.equal(failed.context.MetaPixel.trackMetaCheckout(), false);
 const denied = fixture(); denied.install(); denied.fire('paula:consent-denied'); denied.setConsent(granted); denied.fire('pageshow');
 assert.equal(denied.context.MetaPixel.trackMetaCheckout(), false);
});
test('expired consent at click and unavailable hosts cannot emit checkout', () => {
 const f = fixture({ consent: granted }); f.install();
 f.setConsent(JSON.stringify({ version: 1, at: 1, analytics: true, advertising: true }));
 assert.equal(f.context.MetaPixel.trackMetaCheckout(), false);
 const preview = fixture({ consent: granted, hostname: 'preview.vercel.app' }); preview.install();
 assert.equal(preview.context.MetaPixel.trackMetaCheckout(), false);
});

test('storage failure and throwing SDK cannot leak checkout or break navigation', () => {
 const f = fixture({ consent: granted }); f.install();
 f.context.localStorage.getItem = () => { throw new Error('unavailable'); };
 assert.equal(f.context.MetaPixel.trackMetaCheckout(), false);
 const broken = fixture({ consent: granted }); broken.install();
 broken.context.window.fbq.callMethod = () => { throw new Error('blocked'); };
 assert.equal(broken.context.MetaPixel.trackMetaCheckout(), false);
});

const receipt = { version: 1, eventId: '934b02bd-40fb-4ff1-836f-8f2f390c1077' };
test('accepted lead targets only owned pixel, strips fields and deduplicates receipt', () => {
 const f = fixture({ consent: granted }); f.install();
 assert.equal(f.context.MetaPixel.measureMetaAcceptedLead({ ...receipt, email: 'private@example.test' }), true);
 assert.deepEqual(JSON.parse(JSON.stringify(f.context.window.fbq.queue.at(-1))), ['trackSingle', '577841214418796', 'Lead', {}, { eventID: receipt.eventId }]);
 assert.equal(f.context.MetaPixel.measureMetaAcceptedLead(receipt), false);
 for (const value of [null, {ok:true}, {version:1,eventId:'bad'}, {version:2,eventId:receipt.eventId}]) assert.equal(f.context.MetaPixel.measureMetaAcceptedLead(value), false);
});
test('leads require current consent, canonical host and SDK ownership', () => {
 for (const f of [fixture(), fixture({consent:granted,hostname:'preview.vercel.app'}), fixture({consent:granted,pathname:'/admin/'})]) {
  f.install(); assert.equal(f.context.MetaPixel.measureMetaAcceptedLead(receipt),false);
 }
 const f=fixture({consent:granted}); f.install(); f.setConsent(null);
 assert.equal(f.context.MetaPixel.measureMetaAcceptedLead(receipt),false);
 const replaced=fixture({consent:granted}); replaced.install(); replaced.context.window.fbq=()=>{};
 assert.equal(replaced.context.MetaPixel.measureMetaAcceptedLead(receipt),false);
 const failed=fixture({consent:granted}); failed.install(); [...failed.scripts.values()][0].onerror();
 assert.equal(failed.context.MetaPixel.measureMetaAcceptedLead(receipt),false);
 const broken=fixture({consent:granted}); broken.install(); let calls=0;
 broken.context.window.fbq.callMethod=()=>{ calls++; throw Error('blocked'); };
 assert.equal(broken.context.MetaPixel.measureMetaAcceptedLead(receipt),false);
 assert.equal(broken.context.MetaPixel.measureMetaAcceptedLead(receipt),false);
 assert.equal(calls,1);
});

// Offline model of the observed SDK behavior: revoke pauses queue draining.
// This does not load Meta or prove delivery; it protects the bootstrap ordering
// and the race where consent is withdrawn before the delayed SDK executes.
function drainWithConsentGate(f) {
 const fbq = f.context.window.fbq;
 const events = []; const pixels = []; let allowed = true;
 fbq.callMethod = (command, ...args) => {
  if (command === 'consent') { allowed = args[0] === 'grant'; return; }
  if (command === 'init') pixels.push(args[0]);
  if (command === 'track' && allowed) events.push(args[0]);
 };
 while (allowed && fbq.queue.length) fbq.callMethod(...fbq.queue.shift());
 return { events, pixels };
}
test('delayed SDK can drain initialization and PageView without a grant stranded behind revoke', () => {
 const f = fixture({ consent: granted }); f.install();
 const result = drainWithConsentGate(f);
 assert.deepEqual(result, {events:['PageView'],pixels:['577841214418796']});
 assert.equal(f.context.window.fbq.queue.length,0);
 f.fire('pageshow'); f.fire('paula:consent-change');
 assert.deepEqual(result.events,['PageView']);
});
test('withdrawal or expiry before SDK execution leaves no initialization or PageView to drain', () => {
 for (const raw of [null, JSON.stringify({version:1,at:1,analytics:true,advertising:true})]) {
  const f = fixture({ consent: granted }); f.install(); f.setConsent(raw); f.fire('pageshow');
  assert.deepEqual(drainWithConsentGate(f), {events:[],pixels:[]});
  assert.equal(f.context.MetaPixel.measureMetaAcceptedLead(receipt),false);
  assert.equal(f.context.MetaPixel.trackMetaCheckout(),false);
 }
});
