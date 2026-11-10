import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { viceCity, getViceCityCheckoutUrl } from '../src/data/vice-city.mjs';
import { isPublicSitemapUrl } from '../scripts/sitemap-policy.mjs';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const page = read('src/pages/vice-city.astro');
const component = read('src/components/vice-city/GuideCheckout.astro');

test('confirmed English PDF offer at US$5.99 uses the verified Stan product', () => {
  assert.equal(viceCity.price, '5.99');
  assert.equal(viceCity.currency, 'USD');
  assert.equal(viceCity.language, 'English');
  assert.equal(viceCity.format, 'PDF');
  assert.equal(viceCity.readyForSale, true);
  const checkoutUrl = 'https://stan.store/Paulaambrosio_/p/miami-style-made-simple?lang=en';
  assert.equal(viceCity.checkoutUrl, checkoutUrl);
  assert.equal(getViceCityCheckoutUrl(), checkoutUrl);
  assert.equal(getViceCityCheckoutUrl({ ...viceCity, readyForSale: false }), null);
});

test('checkout only opens when ready and a direct HTTPS Stan product URL is supplied', () => {
  // Test-only URL shape, never an actual product destination.
  const fixture = 'https://stan.store/test-fixture/p/test-guide';
  assert.equal(getViceCityCheckoutUrl({ readyForSale: false, checkoutUrl: fixture }), null);
  assert.equal(getViceCityCheckoutUrl({ readyForSale: true, checkoutUrl: fixture }), fixture);
  for (const checkoutUrl of [null, '', 'not-a-url', 'javascript:alert(1)', '//stan.store/test-fixture/p/test-guide',
    'http://stan.store/test-fixture/p/test-guide', 'https://evil.example/test-fixture/p/test-guide',
    'https://stan.store.evil.example/test-fixture/p/test-guide', 'https://sub.stan.store/test-fixture/p/test-guide',
    'https://user:pass@stan.store/test-fixture/p/test-guide', 'https://stan.store:444/test-fixture/p/test-guide',
    'https://stan.store/', 'https://stan.store/test-fixture', 'https://stan.store/test-fixture/p/',
    'https://stan.store/test-fixture/product/test-guide', 'https://stan.store/test-fixture/p/test-guide/extra']) {
    assert.equal(getViceCityCheckoutUrl({ readyForSale: true, checkoutUrl }), null, String(checkoutUrl));
  }
});

test('both purchase placements share the fail-closed accessible component', () => {
  assert.equal((page.match(/<GuideCheckout\b/g) || []).length, 2);
  assert.match(component, /getViceCityCheckoutUrl\(\)/);
  assert.match(component, /href=\{checkoutUrl\}/);
  assert.match(component, /<button[^>]+type="button" disabled aria-describedby=/);
  assert.match(component, /Sales are not open yet/i);
  assert.match(component, /Coming soon/);
  assert.doesNotMatch(page + component, /<form\b|href="#"|download=|\.pdf["']/);
});

test('landing preserves brand, canonical, noindex and existing consent', () => {
  assert.match(page, /import Layout from '\.\.\/layouts\/Layout\.astro'/);
  assert.match(page, /canonical="\/vice-city\/"/);
  assert.match(page, /\n  noindex\n/);
  assert.equal((page.match(/<h1\b/g) || []).length, 1);
  assert.equal(isPublicSitemapUrl('https://www.paulaambrosio.com/vice-city/'), false);
  assert.ok(read('src/layouts/Layout.astro').includes('<GoogleConsent />'));
  assert.ok(read('src/pages/links.astro').includes("href: '/vice-city/'"));
  for (const file of ['Header', 'Footer']) assert.ok(!read(`src/components/${file}.astro`).includes('/vice-city/'));
});

test('copy distinguishes portfolio imagery and independent inspiration', () => {
  for (const text of ['Color palettes', 'Materials & texture', 'Lighting', 'Layouts', 'Your buying plan',
    'not a completed project', 'not a printed book or a personalized design service',
    'not affiliated with', 'Rockstar Games', 'Take-Two Interactive']) {
    assert.ok(page.includes(text), text);
  }
  for (const asset of ['src/assets/vice-city/guide-artwork.webp', 'src/assets/vice-city/share-artwork.webp', 'src/assets/projects/home-aa/web/03.webp']) {
    assert.ok(existsSync(new URL('../' + asset, import.meta.url)), asset);
  }
  assert.match(page, /Eight pages/);
  assert.doesNotMatch(page + component, /instant (?:access|download)|money.back|testimonials|limited.time/i);
  assert.equal((page.match(/<details>/g) || []).length, 4);
  assert.match(read('src/styles/vice-city.css'), /prefers-reduced-motion: reduce/);
});
