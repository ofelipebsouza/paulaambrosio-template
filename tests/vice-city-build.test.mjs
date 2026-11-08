// Run after npm run build. This checks the emitted page, not source patterns.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const root = new URL('../', import.meta.url);
const doc = new JSDOM(readFileSync(new URL('dist/client/vice-city/index.html', root), 'utf8')).window.document;

test('emitted page has correct metadata, landmarks and no duplicate IDs', () => {
  assert.equal(doc.documentElement.lang, 'en');
  assert.equal(doc.querySelectorAll('h1').length, 1);
  assert.equal(doc.querySelectorAll('main').length, 1);
  assert.equal(doc.querySelector('link[rel="canonical"]').href, 'https://www.paulaambrosio.com/vice-city/');
  assert.equal(doc.querySelector('meta[name="robots"]').content, 'noindex, follow');
  const ids = [...doc.querySelectorAll('[id]')].map(el => el.id);
  assert.equal(ids.length, new Set(ids).size);
});

test('emitted checkout is disabled with real explanatory text and no destination', () => {
  assert.equal(doc.querySelectorAll('.vice-button:disabled').length, 2);
  assert.equal(doc.querySelectorAll('.vice-page a[href*="stan.store"]').length, 0);
  assert.equal(doc.querySelectorAll('.vice-page form').length, 0);
  for (const button of doc.querySelectorAll('.vice-button')) {
    assert.equal(button.getAttribute('type'), 'button');
    assert.match(doc.getElementById(button.getAttribute('aria-describedby')).textContent, /Sales are not open yet/);
  }
});

test('emitted images, descriptions, section anchors and FAQ controls exist', () => {
  for (const el of doc.querySelectorAll('.vice-page [aria-describedby], .vice-page [aria-labelledby]')) {
    for (const id of (el.getAttribute('aria-describedby') || el.getAttribute('aria-labelledby')).split(' ')) {
      assert.ok(doc.getElementById(id), id);
    }
  }
  for (const img of doc.querySelectorAll('.vice-page img')) {
    assert.ok(img.alt);
    assert.ok(existsSync(new URL('dist/client' + img.getAttribute('src'), root)));
  }
  for (const a of doc.querySelectorAll('.vice-page a[href^="#"]')) assert.ok(doc.querySelector(a.getAttribute('href')));
  assert.equal(doc.querySelectorAll('.vice-questions details > summary').length, 4);
  assert.match(doc.body.textContent, /Eight pages/);
  assert.doesNotMatch(doc.body.textContent, /guide is being prepared/);
});


test('US$5.99 is consistent across both offers, metadata, structured data and discovery', () => {
  const prices = [...doc.querySelectorAll('.vice-price')].map(el => el.textContent.trim());
  assert.deepEqual(prices, ['US$5.99', 'US$5.99']);
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    assert.match(doc.querySelector(selector).content, /US\$5\.99/);
  }
  const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(el => JSON.parse(el.textContent));
  const pageSchema = schemas.flatMap(schema => schema['@graph'] ?? [schema]).find(schema => schema['@type'] === 'WebPage');
  assert.ok(pageSchema, 'WebPage structured data exists');
  assert.match(pageSchema.description, /US\$5\.99/);
  const linksDoc = new JSDOM(readFileSync(new URL('dist/client/links/index.html', root), 'utf8')).window.document;
  assert.match(linksDoc.querySelector('a[href="/vice-city/"]').textContent, /US\$5\.99/);
  for (const page of [doc, linksDoc]) assert.doesNotMatch(page.documentElement.outerHTML, /US\$\s*3[.,]99/);
});
