/**
 * Offline contact-click regressions. Execute the actual Analytics.astro script,
 * trackEvent and Google browser/core modules. Only DOM, storage and transports
 * are replaced. No browser, external script, navigation or request is executed.
 * Run: node --test tests/contact-clicks.test.mjs
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import { build } from 'esbuild';

const componentUrl = new URL('../src/components/Analytics.astro', import.meta.url);
const source = await readFile(componentUrl, 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'Analytics.astro must contain its actual client script');
const bundle = await build({
	stdin: {
		contents: `${script}\nimport { saveConsent } from '../lib/google-tracking/browser';
import { SITE } from '../config';
globalThis.contactTest = { saveConsent, SITE };`,
		resolveDir: fileURLToPath(new URL('../src/components/', import.meta.url)),
		sourcefile: 'contact-clicks-client.ts', loader: 'ts',
	},
	bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2022',
	define: { 'import.meta.env': JSON.stringify({ PUBLIC_GOOGLE_TRACKING_ENABLED: 'true' }) },
	plugins: [{
		name: 'offline-vercel-transport',
		setup(builder) {
			builder.onResolve({ filter: /^@vercel\/analytics$/ }, () => ({ path: 'vercel', namespace: 'offline' }));
			builder.onLoad({ filter: /.*/, namespace: 'offline' }, () => ({
				contents: 'export const track = (event, metadata) => globalThis.recordVercel(event, metadata);',
				loader: 'js',
			}));
		},
	}],
});
const code = bundle.outputFiles[0].text;
const plain = value => JSON.parse(JSON.stringify(value));

class Element {
	constructor(attributes = {}, parent = null) {
		this.attributes = new Map(Object.entries(attributes));
		this.parentElement = parent;
	}
	getAttribute(name) { return this.attributes.get(name) ?? null; }
	closest(selector) {
		const matches = selector === '[data-analytics-event]'
			? this.attributes.has('data-analytics-event')
			: selector === 'a[href]' && this instanceof HTMLAnchorElement && this.attributes.has('href');
		return matches ? this : this.parentElement?.closest(selector) ?? null;
	}
}
class HTMLAnchorElement extends Element {}

function fixture({ consent = null, pathname = '/contact/', initializeTwice = false } = {}) {
	const documentListeners = new Map();
	const windowListeners = new Map();
	const storage = new Map();
	const requests = [];
	const vercel = [];
	const scripts = [];
	const blocked = [];
	const navigations = [];
	const addListener = (listeners, name, fn) => listeners.set(name, [...(listeners.get(name) ?? []), fn]);
	const blockNavigation = value => { navigations.push(value); throw new Error('Navigation forbidden in offline tests'); };
	const location = {
		hostname: 'www.paulaambrosio.com', pathname,
		get href() { return `https://www.paulaambrosio.com${pathname}`; },
		set href(value) { blockNavigation(value); },
		assign: blockNavigation, replace: blockNavigation, reload: () => blockNavigation('reload'),
	};
	const document = {
		referrer: '', cookie: '',
		addEventListener: (name, fn) => addListener(documentListeners, name, fn),
		querySelectorAll: () => [],
		getElementById: id => scripts.find(script => script.id === id),
		createElement(tag) {
			assert.equal(tag, 'script', 'Unexpected element creation during click-only verification');
			return { remove() { const index = scripts.indexOf(this); if (index !== -1) scripts.splice(index, 1); } };
		},
		head: { append: script => scripts.push(script) }, // Record only: never load or execute src.
	};
	const window = {
		location, open: blockNavigation,
		addEventListener: (name, fn) => addListener(windowListeners, name, fn),
	};
	const context = vm.createContext({
		window, document, location, Element, HTMLAnchorElement, queueMicrotask,
		localStorage: {
			getItem: key => storage.get(key) ?? null,
			setItem: (key, value) => storage.set(key, value),
			removeItem: key => storage.delete(key),
		},
		recordVercel: (event, metadata) => vercel.push(plain({ event, metadata })),
		fetch: async (url, init) => {
			if (url !== '/api/analytics/collect/') {
				blocked.push(String(url));
				throw new Error('External requests forbidden in offline tests');
			}
			requests.push({ url, method: init.method, body: JSON.parse(init.body) });
			return { ok: true };
		},
	});
	vm.runInContext(code, context);
	if (initializeTwice) vm.runInContext(code, context);
	if (consent) assert.equal(context.contactTest.saveConsent(consent), true);
	return {
		window, scripts, requests, vercel, documentListeners, SITE: context.contactTest.SITE,
		saveConsent: choice => context.contactTest.saveConsent(choice),
		google: event => plain((window.dataLayer ?? []).filter(item => item.event === `paula_${event}`)),
		click(anchor, { nested = false } = {}) {
			// Prevent default before invoking real listeners. These are synthetic objects;
			// there is no live link or browser capable of opening a contact application.
			const event = {
				target: nested ? new Element({}, anchor) : anchor,
				defaultPrevented: false,
				preventDefault() { this.defaultPrevented = true; },
			};
			event.preventDefault();
			for (const listener of documentListeners.get('click') ?? []) listener(event);
			assert.equal(event.defaultPrevented, true);
			assert.deepEqual(navigations, []);
			assert.deepEqual(blocked, []);
			return event;
		},
	};
}

const consentGranted = { analytics: true, advertising: true };
const consentRejected = { analytics: false, advertising: false };
const phone = () => new HTMLAnchorElement({ href: 'tel:+15555550100' });
const whatsapp = attributes => new HTMLAnchorElement({
	href: 'https://wa.me/15555550100?text=private-message-canary&email=private-contact%40example.test#private-token-canary',
	...attributes,
});

// These hrefs come from real source markup, including the SITE configuration.
// This verifies dispatch, not the dialability or full Astro rendering of each URL.
const phoneSources = await Promise.all([
	'../src/pages/contact.astro', '../src/pages/links.astro', '../src/components/Footer.astro',
].map(async path => ({ path, source: await readFile(new URL(path, import.meta.url), 'utf8') })));

test('contact-page literal phone destinations match the displayed numbers in complete E.164 form', () => {
	const contact = phoneSources.find(item => item.path.endsWith('/contact.astro')).source;
	const anchors = [...contact.matchAll(/<a\b[^>]*\bhref="(tel:[^"]+)"[^>]*>([^<]+)<\/a>/g)];
	assert.equal(anchors.length, 2, 'Review coverage if the displayed contact numbers change');
	for (const [, href, label] of anchors) {
		assert.match(href, /^tel:\+[1-9]\d{7,14}$/, 'A displayed phone number must have a complete dialable destination');
		assert.equal(href.slice(4), `+${label.replace(/\D/g, '')}`, 'Click destination must match the visible phone number');
	}
});

test('all seven existing tel anchors dispatch once through the real handler after repeated initialization', () => {
	let checked = 0;
	for (const { path, source } of phoneSources) {
		for (const [anchorMarkup] of source.matchAll(/<a\b[^>]*\bhref=(?:"tel:[^"]*"|\{`tel:[^`]*`\})[^>]*>/g)) {
			const x = fixture({ consent: consentGranted, initializeTwice: true });
			const literal = anchorMarkup.match(/href="([^"]*)"/)?.[1];
			const template = anchorMarkup.match(/href=\{`([^`]*)`\}/)?.[1];
			assert.ok(literal || template === 'tel:${SITE.phoneE164}', `Unrecognized phone template in ${path}`);
			const href = literal ?? `tel:${x.SITE.phoneE164}`;
			assert.equal(x.documentListeners.get('click').length, 1);
			x.click(new HTMLAnchorElement({ href }), { nested: true });
			assert.equal(x.vercel.filter(item => item.event === 'phone_click').length, 1, path);
			assert.equal(x.requests.filter(item => item.body.event === 'phone_click').length, 1, path);
			assert.deepEqual(x.google('phone_click'), [{ event: 'paula_phone_click', page_section: 'contact', service_key: 'none' }]);
			assert.equal(x.requests.filter(item => !item.body.event).length, 1, 'Repeated initialization must not duplicate the page view');
			assert.ok(!JSON.stringify([x.vercel, x.requests, x.window.dataLayer]).includes(href));
			checked++;
		}
	}
	assert.equal(checked, 7, 'Review contact-click coverage if source anchor inventory changes');
});

test('synthetic WhatsApp anchor emits once per click and repeated initialization adds no handler', async () => {
	const x = fixture({ consent: consentGranted, initializeTwice: true });
	assert.equal(x.documentListeners.get('click').length, 1);
	x.click(whatsapp(), { nested: true });
	assert.equal(x.google('whatsapp_click').length, 1);
	assert.equal(x.vercel.filter(item => item.event === 'whatsapp_click').length, 1);
	assert.equal(x.requests.filter(item => item.body.event === 'whatsapp_click').length, 1);
	await Promise.resolve();
	x.click(whatsapp());
	assert.equal(x.google('whatsapp_click').length, 2, 'A later distinct click must not be lost');
});

test('overlapping declarative and href handlers forward one Google event for one synthetic WhatsApp click', () => {
	const x = fixture({ consent: consentGranted });
	x.click(whatsapp({ 'data-analytics-event': 'whatsapp_click' }));
	assert.equal(x.google('whatsapp_click').length, 1);
	// Both real handler branches execute. Google owns the same-turn deduplication;
	// existing Vercel/internal counters are not deduplicated for this synthetic case.
	assert.equal(x.vercel.filter(item => item.event === 'whatsapp_click').length, 2);
	assert.equal(x.requests.filter(item => item.body.event === 'whatsapp_click').length, 2);
});

test('absent and rejected consent block Google forwarding for actual phone and WhatsApp handlers', () => {
	for (const consent of [null, consentRejected]) {
		const x = fixture({ consent });
		x.click(phone());
		x.click(whatsapp());
		assert.equal(x.google('phone_click').length, 0);
		assert.equal(x.google('whatsapp_click').length, 0);
		assert.equal(x.scripts.length, 0);
		assert.equal((x.window.dataLayer ?? []).length, 0);
		assert.deepEqual(x.vercel.map(item => item.event), ['phone_click', 'whatsapp_click'], 'Consent here governs Google, not existing internal/Vercel tracking');
	}
});

test('analytics and advertising permissions independently gate the real contact handlers', () => {
	for (const consent of [{ analytics: true, advertising: false }, { analytics: false, advertising: true }]) {
		const x = fixture({ consent });
		x.click(phone());
		x.click(whatsapp());
		assert.equal(x.google('phone_click').length, Number(consent.analytics));
		assert.equal(x.google('whatsapp_click').length, Number(consent.advertising));
	}
});

test('rejection after a grant suppresses later contact clicks without navigation', async () => {
	const x = fixture({ consent: consentGranted });
	// Simulate the loader's completion callback without fetching or executing it.
	x.scripts[0].onload();
	x.click(phone());
	x.click(whatsapp());
	await Promise.resolve();
	assert.equal(x.saveConsent(consentRejected), true);
	x.click(phone());
	x.click(whatsapp());
	assert.equal(x.google('phone_click').length, 1);
	assert.equal(x.google('whatsapp_click').length, 1);
	assert.equal(x.window.dataLayer.at(-1).paula_analytics_consent, 'denied');
	assert.equal(x.window.dataLayer.at(-1).paula_advertising_consent, 'denied');
});

test('contact hrefs, contact fields and message canaries never enter forwarded click payloads', () => {
	const x = fixture({ consent: consentGranted });
	const anchor = whatsapp({
		'data-analytics-location': 'contact',
		'data-phone': '+15555550100', 'data-email': 'private-contact@example.test',
		'data-message': 'private-message-canary', 'data-name': 'private-name-canary',
	});
	anchor.textContent = 'private-name-canary private-contact@example.test +15555550100';
	x.click(anchor);
	x.click(phone());
	assert.deepEqual(x.google('whatsapp_click'), [{ event: 'paula_whatsapp_click', page_section: 'contact', service_key: 'none' }]);
	assert.deepEqual(x.google('phone_click'), [{ event: 'paula_phone_click', page_section: 'contact', service_key: 'none' }]);
	const payloads = JSON.stringify([x.window.dataLayer, x.vercel, x.requests.map(item => item.body)]);
	for (const canary of ['15555550100', 'private-message', 'private-contact', 'private-token', 'private-name', 'wa.me', 'tel:', '?text=']) {
		assert.ok(!payloads.includes(canary), `Contact data leaked: ${canary}`);
	}
	for (const item of x.google('whatsapp_click').concat(x.google('phone_click'))) {
		assert.deepEqual(Object.keys(item).sort(), ['event', 'page_section', 'service_key']);
	}
});

test('Google receives public catalog enums even when the path contains private-looking text', () => {
	const x = fixture({ consent: consentGranted, pathname: '/contact/private-contact@example.test/?message=private-message-canary#private-token-canary' });
	x.click(whatsapp());
	assert.deepEqual(x.google('whatsapp_click'), [{ event: 'paula_whatsapp_click', page_section: 'contact', service_key: 'none' }]);
	assert.doesNotMatch(JSON.stringify(x.window.dataLayer), /private-|example\.test|\?message=/);
});
