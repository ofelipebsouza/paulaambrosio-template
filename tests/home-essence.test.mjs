import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const page=readFileSync('src/pages/home-essence.astro','utf8');
const data=readFileSync('src/data/home-essence.ts','utf8');
test('Home Essence uses verified USD offer and official checkout',()=>{
 assert.match(data,/price: '49\.87'/); assert.match(data,/currency: 'USD'/);
 assert.match(data,/https:\/\/stan\.store\/Paulaambrosio_\/p\/this-essence-elevates-any-space/);
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
});
test('Editorial film is silent, lazy and scroll-driven with static fallback',()=>{
 assert.match(page,/muted playsinline preload="none"/);
 assert.match(page,/poster="\/images\/home-essence\/editorial-collection.jpg"/);
 assert.match(page,/saveData/);assert.match(page,/filmStatic/);
 assert.doesNotMatch(page,/<video[^>]*(?:autoplay|controls)/);
 assert.match(page,/film\.currentTime=target/);
});
