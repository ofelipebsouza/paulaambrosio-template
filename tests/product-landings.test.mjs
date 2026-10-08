import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (path) => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
for (const slug of ['layout-starter-kit', 'host-up']) {
 test(`${slug}: isolated route, assets, canonical and consent`, () => {
  const head = read(`src/data/landings/${slug}-head.html`);
  const body = read(`src/data/landings/${slug}-body.html`);
  const page = read(`src/pages/${slug}.astro`);
  assert.ok(head.includes(`https://www.paulaambrosio.com/${slug}/`));
  assert.ok(head.includes('property="og:url"'));
  assert.equal((body.match(/<h1[ >]/g) ?? []).length, 1);
  assert.ok(page.includes('<GoogleConsent />'));
  assert.ok(!page.includes('layouts/Layout'));
  assert.ok(!/(?:src|href)="assets\//.test(head + body));
  for (const [, path] of (head + body).matchAll(/(?:src|href)="(\/landing-assets\/[^"?#]+)"/g)) {
   assert.ok(fs.existsSync(new URL('../public' + path, import.meta.url)), path);
  }
 });
}
test('checkout stays pending and discovery is restricted to biolinks', () => {
 const host = read('src/data/landings/host-up-body.html');
 assert.ok(!host.includes('href="https://hotmart.com/'));
 assert.ok(host.includes('Inscrições em breve'));
 assert.ok(host.includes('Nenhuma compra é realizada nesta página.'));
 const layout = read('src/data/landings/layout-starter-kit-body.html');
 assert.ok(layout.includes('mailto:info@paulaambrosio.com'));
 assert.ok(!/<form\b/.test(layout));
 for (const slug of ['layout-starter-kit', 'host-up']) {
  assert.ok(read('src/pages/links.astro').includes(`href: '/${slug}/'`));
  for (const component of ['Header', 'Footer']) assert.ok(!read(`src/components/${component}.astro`).includes(`/${slug}/`));
 }
});
