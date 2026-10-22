import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { initMillworkMotion } from '../src/lib/millwork-motion.ts';

const settle = () => new Promise(setImmediate);

function fixture({ reduced = false, desktop = true } = {}) {
	const dom = new JSDOM('<article><div class="millwork-scroll-progress"></div><div class="millwork-hero-media"><img alt="Concept"></div><div class="millwork-reveal">Upcoming content</div><div class="millwork-reveal">Already visible</div></article>');
	const { window } = dom;
	const preference = new window.EventTarget();
	preference.matches = reduced;
	window.matchMedia = (query) => query === '(prefers-reduced-motion: reduce)'
		? preference : { matches: desktop };
	const root = window.document.querySelector('article');
	root.querySelectorAll('.millwork-reveal').forEach((item, index) => {
		item.getBoundingClientRect = () => ({ top: index === 0 ? 1200 : 100 });
	});
	const calls = { loaded: 0, registered: 0, reverted: 0, tweens: [], batches: [] };
	let disposeContext;
	const gsap = {
		registerPlugin() { calls.registered++; },
		matchMedia() {
			return {
				add(queries, callback, scope) {
					calls.queries = queries;
					assert.equal(scope, root);
					disposeContext = callback({
						conditions: { desktop, mobile: !desktop },
						add: (fn) => fn(),
					});
				},
				revert() { calls.reverted++; disposeContext?.(); },
			};
		},
		set() {},
		fromTo(target, from, to) { calls.tweens.push({ target, from, to }); },
	};
	const libraries = { gsap, ScrollTrigger: { batch(targets, options) { calls.batches.push({ targets, options }); } } };
	const load = async () => { calls.loaded++; return libraries; };
	const changeMotion = (matches) => {
		preference.matches = matches;
		preference.dispatchEvent(new window.Event('change'));
	};
	return { root, window, calls, libraries, load, changeMotion };
}

test('initial reduced motion does not load the animation libraries', async () => {
	const f = fixture({ reduced: true });
	const cleanup = initMillworkMotion(f.root, f.load);
	await settle();
	assert.equal(f.calls.loaded, 0);
	f.changeMotion(false);
	await settle();
	assert.equal(f.calls.loaded, 1);
	cleanup();
});

test('desktop adds small parallax, progress and batched entrances without hiding content', async () => {
	const f = fixture();
	const cleanup = initMillworkMotion(f.root, f.load);
	await settle();
	assert.equal(f.calls.registered, 1);
	assert.equal(f.calls.batches[0].targets.length, 1, 'already-visible content does not replay');
	assert.equal(f.calls.batches[0].options.batchMax, 3);
	assert.equal(f.calls.batches[0].options.once, true);
	assert.equal(f.calls.tweens.length, 2, 'progress plus desktop hero');
	assert.equal(f.calls.tweens[1].to.y, 16);
	assert.match(f.calls.queries.desktop, /prefers-reduced-motion: no-preference/);
	f.calls.batches[0].options.onEnter(f.calls.batches[0].targets);
	const entrance = f.calls.tweens.at(-1);
	assert.equal(entrance.from.opacity, 0.72, 'entrances never make content invisible');
	assert.equal(entrance.to.stagger, 0.1);
	assert.equal(entrance.to.clearProps, 'transform,opacity');
	cleanup();
});

test('mobile has shorter entrances and no hero parallax', async () => {
	const f = fixture({ desktop: false });
	const cleanup = initMillworkMotion(f.root, f.load);
	await settle();
	assert.equal(f.calls.tweens.length, 1, 'only the progress animation');
	assert.equal(f.calls.batches[0].options.batchMax, 1);
	f.calls.batches[0].options.onEnter(f.calls.batches[0].targets);
	assert.equal(f.calls.tweens.at(-1).from.y, 12);
	assert.equal(f.calls.tweens.at(-1).to.duration, 0.5);
	assert.equal(f.calls.tweens.at(-1).to.stagger, 0);
	cleanup();
});

test('cleanup is idempotent and prevents late batch callbacks', async () => {
	const f = fixture();
	const cleanup = initMillworkMotion(f.root, f.load);
	await settle();
	cleanup();
	cleanup();
	const count = f.calls.tweens.length;
	f.calls.batches[0].options.onEnter(f.calls.batches[0].targets);
	assert.equal(f.calls.tweens.length, count);
	assert.equal(f.calls.reverted, 1);
});

test('navigation and Astro swaps dispose animations, but bfcache retains its context', async () => {
	const f = fixture();
	initMillworkMotion(f.root, f.load);
	await settle();
	const cached = new f.window.Event('pagehide');
	cached.persisted = true;
	f.window.dispatchEvent(cached);
	assert.equal(f.calls.reverted, 0);
	f.window.document.dispatchEvent(new f.window.Event('astro:before-swap'));
	assert.equal(f.calls.reverted, 1);
});

test('failed or interrupted imports leave all markup intact', async () => {
	const f = fixture();
	const original = f.root.outerHTML;
	const cleanup = initMillworkMotion(f.root, async () => { throw new Error('simulated chunk failure'); });
	await settle();
	assert.equal(f.root.outerHTML, original);
	cleanup();
	let resolve;
	const pending = new Promise((done) => { resolve = done; });
	const stop = initMillworkMotion(f.root, () => pending);
	stop();
	resolve(f.libraries);
	await settle();
	assert.equal(f.calls.registered, 0);
	assert.equal(f.root.outerHTML, original);
});

test('page has a visible no-JS fallback and keeps concepts distinct and technical hyphens', () => {
	const page = readFileSync(new URL('../src/pages/millwork.astro', import.meta.url), 'utf8');
	assert.doesNotMatch(page, /\.js \.millwork-reveal/);
	assert.doesNotMatch(page, / — /);
	assert.match(page, /Millwork concept/);
	assert.match(page, /separate from the completed projects shown below/);
	assert.doesNotMatch(page, /AI-generated|AI concept|[→↗↓]/);
	assert.match(page, /built-ins/);
	assert.match(page, /opacity: 1 !important/);
	const motion = readFileSync(new URL('../src/lib/millwork-motion.ts', import.meta.url), 'utf8');
	assert.doesNotMatch(motion, /(?:ScrollSmoother|normalizeScroll|preventDefault|pin:\s*true)/);
});
