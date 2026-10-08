/** Offline UI regressions: run the actual form script with synthetic fields and mocked fetch. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { transform } from 'esbuild';

const source = await readFile(new URL('../src/components/Analytics.astro', import.meta.url), 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
	.replace(/import \{([^}]+)\} from '[^']+';/g, 'const {$1} = boundary;');
const { code } = await transform(script, { loader: 'ts', target: 'es2022' });
async function sourceExports(path) {
	const source = await readFile(new URL(path, import.meta.url), 'utf8');
	const { code } = await transform(source, { loader: 'ts', format: 'cjs', target: 'es2022' });
	const module = { exports: {} };
	vm.runInNewContext(code, { module, exports: module.exports });
	return module.exports;
}
const { CONTACT_FIELDS, HONEYPOT_FIELD } = await sourceExports('../src/lib/contact-form.ts');
const { ANALYTICS_EVENTS } = await sourceExports('../src/lib/analytics/events.ts');

class Element {
	listeners = new Map();
	attributes = new Map();
	children = [];
	set textContent(value) { this.children = [value]; }
	get textContent() { return this.children.map(child => typeof child === 'string' ? child : child.textContent).join(''); }
	setAttribute(name, value) { this.attributes.set(name, value); }
	getAttribute(name) { return this.attributes.get(name) ?? null; }
	addEventListener(name, listener) { this.listeners.set(name, listener); }
	fire(name, event = {}) { return this.listeners.get(name)?.(event); }
	dispatchEvent(event) { this.fire(event.type, event); }
	append(...children) { this.children.push(...children); }
}

function fixture(responses, { formId = 'contact', email = 'studio@example.test', honeypot = '' } = {}) {
	const button = new Element();
	button.textContent = 'Submit Inquiry';
	button.disabled = false;
	const status = new Element();
	const form = new Element();
	form.dataset = { analyticsForm: formId, contactEmail: email };
	form.method = 'post';
	form.setAttribute('action', '/api/contact/');
	form.fields = new Map([
		['name', 'Fixture & Visitor'], ['email', 'visitor@example.test'],
		['message', 'First line\nSecond line & details'], ['service', 'Renovation'],
		['propertyType', 'Primary Residence'], [HONEYPOT_FIELD, honeypot],
		['cf-turnstile-response', 'private-fixture-token'], ['utm_source', 'private-fixture-source'],
	]);
	form.querySelector = selector => selector === '.analytics-form-status' ? status : button;
	let resets = 0;
	form.reset = () => { resets++; for (const key of form.fields.keys()) form.fields.set(key, ''); };
	const document = new Element();
	document.referrer = '';
	document.querySelectorAll = () => [form];
	document.createElement = tag => {
		assert.equal(tag, 'a');
		const link = new Element();
		link.tagName = 'A';
		return link;
	};
	let navigations = 0;
	const location = { pathname: '/contact/', set href(value) { navigations++; } };
	const events = [];
	const accepted = [];
	let uuids = 0;
	const requests = [];
	class FormData {
		constructor(form) { this.fields = new Map(form.fields); }
		get(name) { return this.fields.get(name) ?? null; }
	}
	class CustomEvent {
		constructor(type, { detail } = {}) { this.type = type; this.detail = detail; }
	}
	const fetch = async (url, init) => {
		if (url === '/api/analytics/collect/') return Response.json({ ok: true });
		assert.equal(url, '/api/contact/', 'Tests must never call a live service');
		requests.push(init);
		const result = responses.shift();
		assert.ok(result, 'Unexpected extra request');
		if (result instanceof Error) throw result;
		return typeof result === 'function' ? result() : result;
	};
	vm.runInNewContext(code, {
		document, window: { location, crypto: { randomUUID: () => `934b02bd-40fb-4ff1-836f-${String(++uuids).padStart(12,'0')}` } }, fetch, FormData, CustomEvent, Element,
		boundary: { CONTACT_FIELDS, HONEYPOT_FIELD, ANALYTICS_EVENTS, measureAcceptedLead: receipt => accepted.push(receipt), trackEvent: (event, data) => events.push({ event, data }) },
	});
	return {
		form, button, status, events, requests, accepted,
		submit: () => form.fire('submit', { preventDefault() {} }),
		link: () => status.children.find(child => child?.tagName === 'A'),
		resets: () => resets, navigations: () => navigations,
	};
}
const response = (status, error) => Response.json(error ? { ok: false, error } : { ok: true }, { status });
function assertRestored(x) {
	assert.equal(x.button.disabled, false);
	assert.equal(x.button.textContent, 'Submit Inquiry');
	assert.equal(x.form.getAttribute('aria-busy'), 'false');
}
function assertError(x) {
	assertRestored(x);
	assert.equal(x.resets(), 0);
	assert.equal(x.form.fields.get('email'), 'visitor@example.test');
	assert.equal(x.navigations(), 0, 'A failure must never automatically open an email app');
	assert.deepEqual(x.events.map(item => item.event), ['form_submit', 'form_error']);
}

for (const [status, error] of [[502, 'delivery_failed'], [503, 'delivery_unavailable']]) {
	for (const formId of ['contact', 'project_inquiry']) {
		test(`${formId}: ${status} offers an explicit email draft, keeps fields, and never claims success`, async () => {
			const x = fixture([response(status, error)], { formId });
			await x.submit();
			assertError(x);
			const link = x.link();
			assert.equal(link.textContent, 'Open email draft');
			const draft = new URL(link.href);
			assert.equal(draft.protocol, 'mailto:');
			assert.equal(draft.pathname, 'studio@example.test');
			assert.equal(draft.searchParams.get('subject'), 'New Project Inquiry — Fixture & Visitor');
			assert.match(draft.searchParams.get('body'), /Message: First line\nSecond line & details/);
			assert.doesNotMatch(link.href, /private-fixture/);
			assert.match(x.status.textContent, /press Send in your email app/);
			x.form.fields.set('message', 'Updated after failure');
			link.fire('click', { preventDefault() { assert.fail('Valid draft should open when clicked'); } });
			assert.match(new URL(link.href).searchParams.get('body'), /Updated after failure/);
			assert.equal(x.events.filter(item => item.event === 'form_success').length, 0);
		});
	}
}

test('200 success resets the form and emits one success without offering an email draft', async () => {
	const x = fixture([response(200)]);
	await x.submit();
	assertRestored(x);
	assert.equal(x.resets(), 1);
	assert.equal(x.form.fields.get('email'), '');
	assert.equal(x.link(), undefined);
	assert.deepEqual(x.events.map(item => item.event), ['form_submit', 'form_success']);
	assert.match(x.status.textContent, /has been received/);
});

test('validation, verification, rate limits, malformed gateways and network errors offer no false delivery fallback', async () => {
	for (const result of [
		response(422, 'validation_failed'), response(403, 'verification_failed'), response(429, 'rate_limited'),
		response(502, 'unrelated_error'), response(503, 'delivery_failed'),
		new Response('Gateway unavailable', { status: 503 }), new Error('Offline'),
	]) {
		const x = fixture([result]);
		await x.submit();
		assertError(x);
		assert.equal(x.link(), undefined);
	}
});

test('absent recipient and populated honeypot cannot produce an email draft', async () => {
	for (const options of [{ email: '' }, { honeypot: 'bot-value' }]) {
		const x = fixture([response(502, 'delivery_failed')], options);
		await x.submit();
		assertError(x);
		assert.equal(x.link(), undefined);
	}
});

test('retry clears stale fallback, prevents duplicate submissions, and restores the button after success', async () => {
	let resolve;
	const pending = new Promise(done => { resolve = done; });
	const x = fixture([response(502, 'delivery_failed'), () => pending]);
	await x.submit();
	assertError(x);
	assert.ok(x.link());
	const retry = x.submit();
	assert.equal(x.link(), undefined);
	assert.equal(x.status.textContent, '');
	assert.equal(x.button.disabled, true);
	assert.equal(x.button.textContent, 'Sending…');
	assert.equal(x.form.getAttribute('aria-busy'), 'true');
	await x.submit();
	assert.equal(x.requests.length, 2);
	resolve(response(200));
	await retry;
	assertRestored(x);
	assert.equal(x.resets(), 1);
	assert.deepEqual(x.events.map(item => item.event), ['form_submit', 'form_error', 'form_submit', 'form_success']);
});


test('only server acceptance is forwarded, including accepted CRM writes followed by SMTP failure', async () => {
 const receipt = {version:1,eventId:'934b02bd-40fb-4ff1-836f-8f2f390c1077'};
 for (const status of [200,502,503]) {
  const x = fixture([Response.json({ok:status===200,error:status===502?'delivery_failed':'delivery_unavailable',leadAcceptance:receipt},{status})]);
  await x.submit();
  assert.deepEqual(x.accepted, [receipt]);
  if(status!==200) assertError(x);
 }
 for(const status of [200,403,422,429,500]) {
  const x=fixture([response(status)]); await x.submit(); assert.equal(x.accepted.length,0);
 }
});
test('a retried unchanged inquiry reuses its nonce while edited input gets a new nonce', async () => {
 const x=fixture([new Error('lost response'),response(502,'delivery_failed'),response(502,'delivery_failed')]);
 await x.submit(); await x.submit();
 assert.equal(x.requests[0].headers['X-Submission-Id'],x.requests[1].headers['X-Submission-Id']);
 x.form.fields.set('message','Changed inquiry'); await x.submit();
 assert.notEqual(x.requests[1].headers['X-Submission-Id'],x.requests[2].headers['X-Submission-Id']);
 assert.equal(x.accepted.length,0);
});
