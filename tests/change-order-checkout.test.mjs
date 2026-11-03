import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
const read = path => readFileSync(path, 'utf8');
const configBundle = (await build({ entryPoints: ['src/lib/change-order/checkout.ts'], bundle: true, write: false, format: 'iife', globalName: 'Checkout' })).outputFiles[0].text;
const context = { URL }; vm.runInNewContext(configBundle, context);
const { checkoutUrl } = context.Checkout;
// Test-only fixtures, not real product offers; never navigated or installed in config.
const base = 'https://pay.hotmart.com/TESTBASE';
const bundle = 'https://pay.hotmart.com/TESTBUNDLE?off=test';
test('checkout configuration rejects ambiguous and unsafe destinations', () => {
 for (const value of [undefined, '', '/checkout', 'javascript:alert(1)', 'http://pay.hotmart.com/X', 'https://pay.hotmart.com.evil.test/X', 'https://u:p@pay.hotmart.com/X', 'https://pay.hotmart.com/', 'https://pay.hotmart.com/X#fragment', 'https://pay.hotmart.com:444/X', 'https://hotmart.com/X']) assert.equal(checkoutUrl(value), '');
 assert.equal(checkoutUrl(base), base); assert.equal(checkoutUrl(bundle), bundle);
});
function fixture(baseUrl = '', bundleUrl = '') {
 const dom = new JSDOM('<html><head></head><body>' + read('src/data/landings/change-order-body.html') + '</body></html>', { url: 'https://www.paulaambrosio.com/change-order/', runScripts: 'outside-only' });
 const w = dom.window;
 w.matchMedia = () => ({ addEventListener() {} });
 w.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
 w.HTMLDialogElement.prototype.close = function() { this.open = false; this.dispatchEvent(new w.Event('close')); };
 w.document.body.dataset.checkoutBase = baseUrl; w.document.body.dataset.checkoutBundle = bundleUrl;
 w.eval(read('public/landing-assets/change-order/script.js'));
 return { w, doc: w.document, close: () => w.close() };
}
test('base-only link preserves bundle fallback, languages, modal dismissal and pageshow selection', () => {
 const { w, doc, close } = fixture(base);
 const link = doc.getElementById('checkout-link'), opener = doc.getElementById('open-interest'), addon = doc.getElementById('include-addon');
 assert.equal(link.href, base); assert.equal(opener.hidden, true);
 addon.checked = true; addon.dispatchEvent(new w.Event('change'));
 assert.equal(link.hidden, true); assert.equal(link.hasAttribute('href'), false); assert.equal(opener.hidden, false);
 doc.querySelector('[data-language="en"]').click();
 assert.equal(doc.getElementById('offer-total').textContent, 'US$36.99');
 assert.match(doc.getElementById('checkout-faq').textContent, /not yet open for this selection/);
 opener.click(); assert.equal(doc.getElementById('interest-dialog').open, true);
 doc.querySelector('.dialog-close').click(); assert.equal(doc.activeElement, opener);
 opener.click(); w.dispatchEvent(new w.Event('pagehide')); assert.equal(doc.getElementById('interest-dialog').open, false);
 addon.checked = false; w.dispatchEvent(new w.Event('pageshow')); assert.equal(link.href, base); assert.equal(link.hidden, false);
 doc.querySelector('[data-language="pt"]').click(); assert.equal(link.textContent, 'Continuar para o checkout ↗');
 close();
});
test('unconfigured flow stays interest-only and bundle uses its own destination', () => {
 for (const destinations of [['', ''], [base, bundle]]) {
  const { w, doc, close } = fixture(...destinations);
  const addon = doc.getElementById('include-addon'); addon.checked = true; addon.dispatchEvent(new w.Event('change'));
  const link = doc.getElementById('checkout-link');
  assert.equal(link.hidden, !destinations[1]);
  if (destinations[1]) assert.equal(link.href, bundle); else assert.equal(link.hasAttribute('href'), false);
  close();
 }
});
const trackingBundle = (await build({ entryPoints: ['src/lib/change-order/tracking.ts'], bundle: true, write: false, format: 'iife', globalName: 'Tracking', define: { 'import.meta.env.PUBLIC_CHANGE_ORDER_META_DIRECT_ENABLED': '\"false\"' }, plugins: [{ name: 'pixel-spy', setup(b) { b.onResolve({ filter: /meta-pixel\/browser/ }, () => ({ path: 'spy', namespace: 'spy' })); b.onLoad({ filter: /.*/, namespace: 'spy' }, () => ({ contents: 'export function installMetaPixel(){ globalThis.installs++; } export function trackMetaCheckout(){ globalThis.attempts++; if (!globalThis.measurementSucceeds) return false; globalThis.events++; return true; }' })); } }] })).outputFiles[0].text;
function trackingFixture() {
 const f = fixture(base);
 const { w, doc } = f;
 const link = doc.getElementById('checkout-link');
 const listeners = [];
 link.addEventListener = (name, fn) => { assert.equal(name, 'click'); listeners.push(fn); };
 w.installs = 0; w.attempts = 0; w.events = 0; w.measurementSucceeds = true;
 w.eval(trackingBundle + '\nwindow.Tracking = Tracking;');
 const activate = (overrides = {}) => {
  const event = { isTrusted: true, defaultPrevented: false, button: 0, ...overrides };
  listeners.forEach(listener => listener(event));
  assert.equal(event.defaultPrevented, Boolean(overrides.defaultPrevented), 'navigation remains unaffected');
 };
 return { ...f, link, listeners, activate };
}
test('only trusted outbound checkout activations emit, with opt-in and idempotent install', () => {
 const { w, doc, link, listeners, activate, close } = trackingFixture();
 w.Tracking.installChangeOrderTracking(); assert.equal(w.installs, 0); assert.equal(listeners.length, 0);
 w.Tracking.installChangeOrderTracking(true); w.Tracking.installChangeOrderTracking(true);
 assert.equal(w.installs, 1); assert.equal(listeners.length, 1);
 activate({ isTrusted: false }); activate({ defaultPrevented: true }); activate({ button: 2 });
 doc.getElementById('include-addon').checked = true; activate();
 doc.getElementById('include-addon').checked = false; link.hidden = true; activate();
 link.hidden = false;
 assert.equal(w.attempts, 0); activate(); assert.equal(w.events, 1);
 close();
});
test('repeated trusted activation and reinstall emit only once per departure', () => {
 const { w, listeners, activate, close } = trackingFixture();
 w.Tracking.installChangeOrderTracking(true);
 activate(); activate();
 w.Tracking.installChangeOrderTracking(true); activate();
 assert.equal(listeners.length, 1); assert.equal(w.attempts, 1); assert.equal(w.events, 1);
 close();
});
test('failed measurement leaves a genuine checkout attempt retryable', () => {
 const { w, activate, close } = trackingFixture();
 w.Tracking.installChangeOrderTracking(true);
 w.measurementSucceeds = false; activate(); activate();
 assert.equal(w.attempts, 2); assert.equal(w.events, 0);
 w.measurementSucceeds = true; activate(); activate();
 assert.equal(w.attempts, 3); assert.equal(w.events, 1);
 close();
});
test('pageshow after back navigation permits one new measured departure', () => {
 const { w, activate, close } = trackingFixture();
 w.Tracking.installChangeOrderTracking(true);
 activate(); activate(); assert.equal(w.events, 1);
 w.dispatchEvent(new w.PageTransitionEvent('pageshow', { persisted: true }));
 assert.equal(w.events, 1, 'restoring the page itself emits nothing');
 activate(); activate(); assert.equal(w.events, 2); assert.equal(w.attempts, 2);
 close();
});
