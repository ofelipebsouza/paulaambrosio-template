import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

async function load(path) {
  const output = await build({ entryPoints: [path], bundle: true, write: false, format: 'iife', globalName: 'Checkout' });
  const context = { URL };
  vm.runInNewContext(output.outputFiles[0].text, context);
  return context.Checkout;
}
const { hostUpCheckout } = await load('src/lib/host-up/checkout.ts');
const { stripeCheckoutUrl } = await load('src/lib/home-essence/checkout.ts');
const body = readFileSync('src/data/landings/host-up-body.html', 'utf8');

test('HOST UP stays unavailable with absent, marketplace or unsafe configuration', () => {
  for (const value of [undefined, '', '  ', 'https://hotmart.com/product', 'https://pay.hotmart.com.evil.test/X', 'javascript:alert(1)', 'https://pay.hotmart.com/']) {
    assert.equal(hostUpCheckout(body, value), body);
  }
});
test('HOST UP renders exact offer and consistent copy without client JS', () => {
  // Local fixtures only; never requested or installed in a deployment.
  const url = 'https://pay.hotmart.com/TESTHOST?off=test&label=%22safe%22&literal=$&';
  const dom = new JSDOM(hostUpCheckout(body, url));
  const doc = dom.window.document;
  const link = doc.querySelector('#acesso a.buy');
  assert.equal(link.getAttribute('href'), url);
  assert.match(link.textContent, /R\$49/);
  assert.equal(doc.querySelectorAll('a[href^="https://pay.hotmart.com/"]').length, 1);
  assert.match(doc.querySelector('.offer-note').textContent, /continuará para a Hotmart/);
  assert.match(doc.querySelector('#duvidas').textContent, /R\$49/);
  assert.match(doc.querySelector('#duvidas').textContent, /Confira na Hotmart quais guias/);
  assert.doesNotMatch(doc.querySelector('#acesso').textContent, /Inscrições em breve|Nenhuma compra/);
  assert.equal(doc.querySelector('.header-cta').getAttribute('href'), '#acesso');
  assert.equal(doc.querySelectorAll('form, iframe').length, 0);
  dom.window.close();
});
test('HOST UP rejects source drift instead of publishing contradictory purchase instructions', () => {
  assert.throws(() => hostUpCheckout(body.replace('Inscrições em breve', 'Alterado'), 'https://pay.hotmart.com/TESTHOST'), /markup changed/);
});
test('Stripe accepts only direct HTTPS Payment Links and blank disables ordering', () => {
  for (const value of [undefined, '', '  ', '/checkout', 'javascript:alert(1)', 'http://buy.stripe.com/X', 'https://buy.stripe.com.evil.test/X', 'https://u:p@buy.stripe.com/X', 'https://buy.stripe.com/', 'https://buy.stripe.com/X#fragment', 'https://buy.stripe.com:444/X', 'https://checkout.stripe.com/X']) {
    assert.equal(stripeCheckoutUrl(value), '');
  }
  const url = 'https://buy.stripe.com/test_CHECKOUT?locale=en';
  assert.equal(stripeCheckoutUrl(` ${url} `), url);
});
