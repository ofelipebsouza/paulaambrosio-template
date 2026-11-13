import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const page=readFileSync('src/pages/home-essence.astro','utf8');
const data=readFileSync('src/data/home-essence.ts','utf8');
test('Home Essence uses the verified USD offer and Stripe checkout',()=>{
 assert.match(data,/price: '47\.90'/); assert.match(data,/currency: 'USD'/);
 assert.match(data,/checkoutUrl: 'https:\/\/buy\.stripe\.com\/6oU00j26a5y81sM8tTfQI01'/);
 assert.equal((page.match(/href=\{product\.checkoutUrl\}/g)||[]).length,2);
 assert.match(page,/US\$\$\{product\.price\}/);
 assert.match(page,/secure Stripe checkout/);
 assert.doesNotMatch(`${page}\n${data}`,/stan\.store|official Stan store|49\.87/);
 assert.equal((page.match(/<h1\b/g)||[]).length,1);
 assert.match(page,/canonical="\/home-essence\/"/);
 assert.doesNotMatch(page,/<form\b/);
});
test('Product artwork, motion fallback and merchant limitations are retained',()=>{
 assert.ok(existsSync('public/images/home-essence/collection.jpg'));
 assert.match(page,/prefers-reduced-motion:reduce/);
 assert.match(page,/IntersectionObserver/);
 assert.match(page,/Confirm the presentation included/);
 assert.match(page,/shipping/i);
 assert.doesNotMatch(page,/offers delivery in the USA/);
});
test('Current amber bottle artwork and notes replace retired product visuals',()=>{
 for(const name of ['front','back','notes','invitation','signature','evening']) assert.ok(existsSync(`public/images/home-essence/${name}.jpg`));
 assert.match(page,/Cardamom · Amber · Vetiver/);
 assert.match(page,/100 mL/);
 assert.match(page,/Medium intensity/);
 assert.match(page,/Concept visuals supplied/);
 assert.doesNotMatch(page,/editorial-collection|editorial-blush|editorial-clear|essence-film.mp4|<video/);
});
