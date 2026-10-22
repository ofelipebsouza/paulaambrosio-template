import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const root = process.cwd();
const body = readFileSync(join(root, 'src/data/landings/change-order-body.html'), 'utf8');
const page = readFileSync(join(root, 'src/pages/change-order.astro'), 'utf8');
const script = readFileSync(join(root, 'public/landing-assets/change-order/script.js'), 'utf8');
const videoPath = join(root, 'public/landing-assets/change-order/paula-change-order-vsl.mp4');
const posterPath = join(root, 'public/landing-assets/change-order/paula-change-order-vsl-poster.jpg');

test('Change Order VSL uses local media with accessible native controls', () => {
  assert.ok(statSync(videoPath).size > 0, 'VSL MP4 is missing or empty');
  assert.ok(statSync(posterPath).size > 0, 'VSL poster is missing or empty');
  assert.match(body, /<video\b[^>]*controls[^>]*playsinline[^>]*preload="metadata"/);
  assert.match(body, /poster="\/landing-assets\/change-order\/paula-change-order-vsl-poster\.jpg"/);
  assert.match(body, /<source src="\/landing-assets\/change-order\/paula-change-order-vsl\.mp4" type="video\/mp4">/);
  assert.match(body, /aria-labelledby="paula-video-title"/);
  assert.match(body, /aria-describedby="paula-video-note"/);
  assert.doesNotMatch(body, /\bautoplay\b|canplaythrough|video.*gating/i);
});

test('VSL has a no-JS reading path and PT/EN translations', () => {
  assert.match(body, /class="paula-video-text-link" href="#paula"/);
  assert.match(body, /Seu navegador não reproduz vídeo/);
  assert.match(body, /<a href="#paula">história da Paula<\/a>/);
  for (const text of [
    'A HISTÓRIA DA PAULA',
    'Leia a história completa da Paula',
    'Seu navegador não reproduz vídeo. Leia a',
    'história da Paula',
  ]) assert.ok(script.includes(text), 'missing translation key: ' + text);
  assert.match(body, /id="oferta"/, 'offer must remain in the page');
  assert.match(page, /\.paula-video-text-link/);
});

test('language toggle translates the VSL and keeps the offer available', () => {
  const dom = new JSDOM('<!doctype html><html lang="pt-BR"><head><meta property="og:image"><meta name="description"><meta property="og:locale"><meta property="og:title"><meta property="og:description"><meta property="og:image:alt"></head><body>' + body + '</body></html>', {
    url: 'https://example.test/change-order/',
    runScripts: 'outside-only',
  });
  const { window } = dom;
  window.matchMedia = () => ({ addEventListener() {} });
  window.scrollTo = () => {};
  window.eval(script);
  const en = window.document.querySelector('[data-language="en"]');
  const pt = window.document.querySelector('[data-language="pt"]');
  en.click();
  assert.equal(window.document.documentElement.lang, 'en');
  assert.equal(window.document.querySelector('.paula-video-copy .eyebrow').textContent, "PAULA'S STORY");
  assert.match(window.document.querySelector('.paula-video-text-link').textContent, /Read Paula's complete story/);
  assert.match(window.document.querySelector('video p').textContent, /Your browser cannot play video/);
  assert.equal(window.document.querySelector('video').getAttribute('aria-labelledby'), 'paula-video-title');
  assert.equal(window.document.querySelector('video').getAttribute('aria-describedby'), 'paula-video-note');
  assert.ok(window.document.querySelector('#oferta'), 'offer must remain accessible in English');
  pt.click();
  assert.equal(window.document.documentElement.lang, 'pt-BR');
  assert.equal(window.document.querySelector('.paula-video-copy .eyebrow').textContent, 'A HISTÓRIA DA PAULA');
  assert.match(window.document.querySelector('.paula-video-text-link').textContent, /Leia a história completa da Paula/);
  assert.match(window.document.querySelector('video p').textContent, /Seu navegador não reproduz vídeo/);
  assert.ok(window.document.querySelector('#oferta'), 'offer must remain accessible in Portuguese');
});
