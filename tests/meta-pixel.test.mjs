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
test('grant queues revoke, autoConfig, init, grant and one PageView; repeated signals do not duplicate', () => {
 const f = fixture({ consent: granted }); f.install(); f.fire('pageshow'); f.fire('paula:consent-change'); assert.equal(f.scripts.size, 1); assert.equal(f.context.window.fbq.push, f.context.window.fbq); assert.equal(f.context.window._fbq, f.context.window.fbq); assert.deepEqual(JSON.parse(JSON.stringify(f.context.window.fbq.queue.map(x => x[0]))), ['consent', 'set', 'init', 'consent', 'track']);
});
test('revocation clears delayed queue and is terminal across reacceptance', () => {
 const f = fixture({ consent: granted }); f.install(); f.setConsent(JSON.stringify({ version: 1, at: 1800000000000, analytics: false, advertising: false })); f.fire('paula:consent-denied'); assert.deepEqual(JSON.parse(JSON.stringify(f.context.window.fbq.queue)), [['consent', 'revoke']]); f.setConsent(granted); f.fire('paula:consent-change'); assert.equal(f.scripts.size, 0);
});
