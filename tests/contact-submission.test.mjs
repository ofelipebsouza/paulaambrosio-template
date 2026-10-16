/** Offline UI regressions: run the actual form script with synthetic fields and mocked fetch. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
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
function fixture(responses, { formId = 'contact', email = 'studio@example.test', honeypot = '' } = {}) {
	const dom = new JSDOM('<!doctype html><form data-analytics-form="contact" action="/api/contact/" method="post"><button type="submit">Submit Inquiry</button><p class="analytics-form-status" role="status" aria-live="polite"></p></form>', { url: 'https://local.example.test/contact/', runScripts: 'outside-only' });
	const { document, CustomEvent, Event } = dom.window;
	const form = document.querySelector('form');
	const button = form.querySelector('button');
	const status = form.querySelector('.analytics-form-status');
	form.dataset.analyticsForm = formId;
	form.dataset.contactEmail = email;
	const initialFields = new Map([
		['name', 'Fixture & Visitor'], ['email', 'visitor@example.test'],
		['message', 'First line\nSecond line & details'], ['service', 'Renovation'],
		['propertyType', 'Primary Residence'], [HONEYPOT_FIELD, honeypot],
		['cf-turnstile-response', 'private-fixture-token'], ['utm_source', 'private-fixture-source'],
	]);
	for (const [name, value] of initialFields) {
		const wrapper = document.createElement('div');
		const field = document.createElement(name === 'message' ? 'textarea' : name === 'service' ? 'select' : 'input');
		field.name = name;
		if (name === 'service') for (const optionValue of ['', 'Renovation']) {
			const option = document.createElement('option'); option.value = optionValue; option.textContent = optionValue; field.append(option);
		}
		field.value = value;
		wrapper.append(field); form.append(wrapper);
	}
	form.fields = {
		get: name => form.elements.namedItem(name)?.value,
		set: (name, value) => { form.elements.namedItem(name).value = value; },
	};
	let resets = 0;
	const reset = form.reset.bind(form);
	form.reset = () => { resets++; reset(); };
	const submitListeners = [];
	const addEventListener = form.addEventListener.bind(form);
	form.addEventListener = (name, listener, options) => {
		if (name === 'submit') submitListeners.push(listener);
		addEventListener(name, listener, options);
	};
	let navigations = 0;
	const events = [], accepted = [], googleAccepted = [], requests = [];
	let uuids = 0;
	const fetch = async (url, init) => {
		if (url === '/api/analytics/collect/') return Response.json({ ok: true });
		assert.equal(url, '/api/contact/', 'Tests must never call a live service');
		requests.push(init);
		const result = responses.shift(); assert.ok(result, 'Unexpected extra request');
		if (result instanceof Error) throw result;
		return typeof result === 'function' ? result() : result;
	};
	Object.assign(dom.window, {
		fetch,
		boundary: { CONTACT_FIELDS, HONEYPOT_FIELD, ANALYTICS_EVENTS, measureAcceptedLead: receipt => accepted.push(receipt), measureGoogleAcceptedLead: receipt => googleAccepted.push(receipt), trackEvent: (event, data) => events.push({ event, data }) },
	});
	Object.defineProperty(dom.window.crypto, 'randomUUID', { value: () => `934b02bd-40fb-4ff1-836f-${String(++uuids).padStart(12,'0')}` });
	dom.window.eval(code);
	return {
		form, button, status, events, requests, accepted, googleAccepted, document,
		submit: () => Promise.all(submitListeners.map(listener => listener(new Event('submit', { cancelable: true })))),
		edit: (name, value, type = 'input') => {
			const field = form.elements.namedItem(name); field.value = value;
			field.dispatchEvent(new Event(type, { bubbles: true }));
		},
		success: () => form.dispatchEvent(new CustomEvent('analytics-form-success')),
		link: () => status.querySelector('a') ?? undefined,
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
	assert.deepEqual(x.events.map(item => item.event).filter(event => event !== 'form_start'), ['form_submit', 'form_error']);
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
			link.dispatchEvent(new x.document.defaultView.Event('click', { cancelable: true }));
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
  assert.deepEqual(x.googleAccepted, [receipt]);
  if(status===200) { assertRestored(x); assert.equal(x.resets(),1); assert.equal(x.form.fields.get('email'),''); assert.match(x.status.textContent,/has been received/); assert.deepEqual(x.events.map(item=>item.event),['form_submit','form_success']); }
  if(status!==200) assertError(x);
 }
 for(const status of [200,403,422,429,500]) {
  const x=fixture([response(status)]); await x.submit(); assert.equal(x.accepted.length,0); assert.equal(x.googleAccepted.length,0);
 }
});
test('a retried unchanged inquiry reuses its nonce while edited input gets a new nonce', async () => {
 const x=fixture([new Error('lost response'),response(502,'delivery_failed'),response(502,'delivery_failed')]);
 await x.submit(); await x.submit();
 assert.equal(x.requests[0].headers['X-Submission-Id'],x.requests[1].headers['X-Submission-Id']);
 x.form.fields.set('message','Changed inquiry'); await x.submit();
 assert.notEqual(x.requests[1].headers['X-Submission-Id'],x.requests[2].headers['X-Submission-Id']);
 assert.equal(x.accepted.length,0); assert.equal(x.googleAccepted.length,0);
});

for (const formId of ['contact', 'project_inquiry']) {
 test(`${formId}: 422 normalizes known errors, preserves data, and focuses a real control`, async () => {
  const x = fixture([Response.json({ errors: { 'unknown"]': 'Ignore me', message: '  Please describe the project.  ', email: { bad: true }, name: '' } }, { status: 422 })], { formId });
  const field = x.form.elements.namedItem('message');
  field.setAttribute('aria-describedby', 'existing-help');
  await x.submit(); assertError(x);
  assert.equal(x.document.activeElement, field);
  assert.equal(field.getAttribute('aria-invalid'), 'true');
  const id = `${formId}-error-message`;
  assert.equal(field.getAttribute('aria-describedby'), `existing-help ${id}`);
  assert.equal(x.document.getElementById(id).textContent, 'Please describe the project.');
  assert.equal(x.status.textContent, 'Message: Please describe the project.');
  assert.ok(x.status.classList.contains('text-red-800'));
  assert.equal(x.form.querySelectorAll('[aria-invalid="true"]').length, 1);
  assert.equal(x.form.fields.get('message'), 'First line\nSecond line & details');
  assert.equal(x.accepted.length, 0); assert.equal(x.googleAccepted.length, 0);
  x.edit('message', 'A revised description');
  assert.equal(field.hasAttribute('aria-invalid'), false);
  assert.equal(field.getAttribute('aria-describedby'), 'existing-help');
  assert.equal(x.document.getElementById(id), null);
  assert.equal(x.status.textContent, '');
 });
}

test('editing one invalid field preserves the other error and updates the summary; change clears selects', async () => {
 const x = fixture([Response.json({ errors: { message: 'Describe your project', service: 'Choose a service' } }, { status: 422 })]);
 await x.submit();
 x.edit('message', 'Edited');
 assert.equal(x.status.textContent, 'Service: Choose a service');
 assert.equal(x.form.elements.namedItem('service').getAttribute('aria-invalid'), 'true');
 x.edit('service', 'Renovation', 'change');
 assert.equal(x.status.textContent, '');
 assert.equal(x.form.querySelectorAll('[aria-invalid]').length, 0);
});

test('retry clears inline errors and summary before request; success clears errors and uses success styling', async () => {
 let resolve;
 const pending = new Promise(done => { resolve = done; });
 const x = fixture([Response.json({ errors: { message: 'Describe your project' } }, { status: 422 }), () => pending]);
 await x.submit(); const retry = x.submit();
 assert.equal(x.status.textContent, '');
 assert.equal(x.form.querySelectorAll('[aria-invalid]').length, 0);
 assert.equal(x.form.querySelectorAll('[id*="-error-"]').length, 0);
 assert.equal(x.form.elements.namedItem('message').hasAttribute('aria-describedby'), false);
 assert.equal(x.resets(), 0);
 resolve(response(200)); await retry;
 assert.equal(x.resets(), 1); assert.match(x.status.textContent, /has been received/);
 assert.ok(x.status.classList.contains('text-coffee'));
 assert.equal(x.status.classList.contains('text-red-800'), false);
 const y = fixture([Response.json({ errors: { message: 'Describe your project' } }, { status: 422 })]);
 await y.submit(); y.success();
 assert.equal(y.form.querySelectorAll('[aria-invalid]').length, 0);
 assert.equal(y.form.querySelectorAll('[id*="-error-"]').length, 0);
 assert.match(y.status.textContent, /has been received/);
});

test('empty, unknown, missing-control and malformed 422 errors use generic visible fallback without throwing', async () => {
 for (const errors of [{}, [], 'message', 1, null, { message: {} }, { message: [] }, { message: '  ' }, { unknown: 'Ignored' }, { location: 'No control exists in this fixture' }]) {
  const x = fixture([Response.json({ errors }, { status: 422 })]);
  await x.submit(); assertError(x);
  assert.match(x.status.textContent, /Something went wrong/);
  assert.ok(x.status.classList.contains('text-red-800'));
  assert.equal(x.form.querySelectorAll('[aria-invalid]').length, 0);
  assert.equal(x.link(), undefined);
 }
});
