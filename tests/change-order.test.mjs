import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const head = read('src/data/landings/change-order-head.html');
const body = read('src/data/landings/change-order-body.html');
const script = read('public/landing-assets/change-order/script.js');
test('change-order: isolated canonical Portuguese route with consent', () => {
 assert.match(head, /https:\/\/www\.paulaambrosio\.com\/change-order\//);
 assert.match(head, /property="og:url"/);
 assert.equal((body.match(/<h1[ >]/g) ?? []).length, 1);
 assert.match(read('src/pages/change-order.astro'), /<GoogleConsent \/>/);
 assert.match(read('src/pages/change-order.astro'), /lang="pt-BR"/);
 for (const [, path] of (head + body).matchAll(/(?:src|href)="(\/landing-assets\/[^"?#]+)"/g)) assert.ok(fs.existsSync(new URL('../public' + path, import.meta.url)), path);
});
test('change-order: fixed prices, optional add-on, no actual checkout or paid downloads', () => {
 assert.match(body, /US\$27,00/); assert.match(body, /US\$9,99/); assert.match(body, /US\$36,99/);
 assert.match(script, /addon\.checked \? 3699 : 2700/);
 assert.match(body, /Vendas em breve/);
 assert.match(body, /Nenhuma compra ou cobrança é realizada nesta página/);
 assert.ok(!/<form\b|(?:href|src)="[^"\s]+\.(?:pdf|docx)|hotmart\.com|pay\.hotmart/.test(body));
 assert.ok(!/\bfetch\(|XMLHttpRequest|sendBeacon|localStorage/.test(script));
 assert.ok(!/<input[^>]+checked/.test(body));
 assert.match(script, /encodeURIComponent/);
 assert.match(body, /não envia nem armazena seu contato/);
 assert.match(body, /Não substitui assessoria jurídica/);
});
test('change-order: navigation scope and dialog semantics', () => {
 assert.match(read('src/pages/links.astro'), /href: '\/change-order\/'/);
 for (const path of ['src/config.ts','src/components/Header.astro','src/components/Footer.astro']) assert.ok(!read(path).includes('/change-order/'));
 assert.match(body, /<dialog[^>]+aria-labelledby="interest-title"/);
 assert.match(body, /aria-live="polite" aria-atomic="true"/);
 assert.match(script, /dialog\.showModal\(\)/);
 assert.match(script, /opener\.focus/);
 assert.match(script, /pagehide/);
 assert.match(read('public/landing-assets/change-order/styles.css'), /prefers-reduced-motion/);
});

test('change-order: official brand artwork and palette', () => {
 assert.equal((body.match(/src="\/brand\/logo-black\.svg"/g) ?? []).length, 2);
 assert.ok(!body.includes('class="monogram"'));
 const css = read('public/landing-assets/change-order/styles.css');
 for (const token of ['#000000', '#f9f5f0', '#ceb297', '#8c6a54']) assert.ok(css.includes(token));
 assert.ok(css.includes('/fonts/Loew-Bold.woff2'));
});

test('change-order: complete English dictionary and language controls', () => {
 const dictionary = JSON.parse(script.match(/const englishCopy = (\{[\s\S]*?\});\nlet language/)[1]);
 assert.ok(Object.keys(dictionary).length > 115);
 for (const text of ['Conhecer o sistema', 'Fechar informações de lançamento', 'Total dos materiais', 'Em que idioma estão os materiais?', 'Idioma da página']) assert.ok(dictionary[text]);
 assert.match(body, /data-language="pt"/);
 assert.match(body, /data-language="en"/);
 assert.match(script, /document\.documentElement\.lang/);
 assert.match(script, /history\.replaceState/);
 assert.match(script, /popstate/);
 assert.ok(!/localStorage|document\.cookie/.test(script));
 for (const image of ['main-en.webp', 'addon-en.webp']) assert.ok(fs.existsSync(new URL('../public/landing-assets/change-order/' + image, import.meta.url)));
});
