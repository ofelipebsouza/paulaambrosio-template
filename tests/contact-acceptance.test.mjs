/**
 * Offline endpoint regressions: bundle the actual contact route, retaining its
 * validation, enrichment, email templates and response construction. Only I/O
 * boundaries are replaced. No real contact, Redis, SMTP or AI request is made.
 * Run: node --test tests/contact-acceptance.test.mjs
 */
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import { build } from 'esbuild';

const SUBMISSION_ID = '11111111-2222-4333-8444-555555555555';
const EVENT_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const SECOND_EVENT_ID = 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff';
const SECOND_SUBMISSION_ID = '22222222-3333-4444-8555-666666666666';
const payload = {
	name: 'Synthetic Fixture Visitor',
	email: 'visitor@example.test',
	phone: '+1 202 555 0100',
	location: 'Synthetic project location',
	propertyType: 'Primary Residence',
	service: 'Renovation',
	budget: 'Prefer to discuss',
	timeline: 'Flexible',
	message: 'Synthetic private project details <fixture> & notes.',
	form_id: 'contact',
	utm_source: 'private-fixture-campaign',
};

const stubs = {
	'../../lib/crm/store': [
		'bumpLedger', 'findBlock', 'countBlockHit', 'findLeadByEmail',
		'insertLead', 'insertLeadWithReceipt', 'pushEvent', 'saveLead',
	],
	'../../lib/rate-limit': ['checkRateLimit', 'hashIdentifier'],
	'../../lib/crm/automation': ['emitJev', 'leadData', 'scheduleFollowUps'],
	'../../lib/crm/jev': ['scoreNewLead'],
};
const bundled = await build({
	entryPoints: [fileURLToPath(new URL('../src/pages/api/contact.ts', import.meta.url))],
	bundle: true,
	write: false,
	platform: 'node',
	format: 'cjs',
	target: 'es2022',
	define: { 'import.meta.env': '__boundary.env' },
	plugins: [{
		name: 'offline-contact-io',
		setup(build) {
			build.onResolve({ filter: /.*/ }, ({ path }) => {
				if (path === 'nodemailer' || Object.hasOwn(stubs, path)) {
					return { path, namespace: 'offline-contact-io' };
				}
			});
			build.onLoad({ filter: /.*/, namespace: 'offline-contact-io' }, ({ path }) => ({
				contents: path === 'nodemailer'
					? 'export default { createTransport: (...args) => __boundary.createTransport(...args) };'
					: stubs[path].map(name => `export const ${name} = (...args) => __boundary.${name}(...args);`).join('\n'),
			}));
		},
	}],
});
const code = bundled.outputFiles[0].text;

function fixture(options = {}) {
	const calls = [];
	const logs = [];
	const durableWrites = [];
	const receipts = new Map();
	const copy = value => structuredClone(value);
	const record = (name, args) => calls.push({ name, args: copy(args) });
	const env = {
		SMTP_USER: 'sender@example.test', SMTP_PASSWORD: 'synthetic-password-marker',
		SMTP_HOST: 'smtp.example.test', CONTACT_RECIPIENT_EMAIL: 'studio@example.test',
		...options.env,
	};
	const failure = name => {
		if (options.failAt === name) throw new Error(`synthetic-${name}-failure`);
	};
	const boundary = {
		env,
		async bumpLedger(...args) {
			record('bumpLedger', args);
			failure(`bumpLedger:${args[0]}`);
		},
		async findBlock(...args) { record('findBlock', args); return options.blocked ? { type: 'email', value: payload.email } : null; },
		async countBlockHit(...args) { record('countBlockHit', args); },
		async findLeadByEmail(...args) { record('findLeadByEmail', args); return options.repeat ? { id: 'existing-private-crm-id' } : null; },
		async insertLead(...args) { record('insertLead', args); failure('insertLead'); },
		async insertLeadWithReceipt(lead, submissionId, fingerprint) {
			record('insertLeadWithReceipt', [lead, submissionId, fingerprint]);
			failure('insertLeadWithReceipt');
			if (options.persistence === 'unavailable' || options.persistence === 'memory') return { status: 'unavailable' };
			if (options.persistence === 'conflict') return { status: 'conflict' };
			const existing = receipts.get(submissionId);
			if (existing && existing.fingerprint !== fingerprint) return { status: 'conflict' };
			if (existing) return { status: 'replayed', receipt: existing.receipt, leadId: existing.leadId };
			const receipt = {
				eventId: durableWrites.length === 0 ? EVENT_ID : SECOND_EVENT_ID,
				// Deliberate extra internal fields: the route must project the public contract.
				internalSecret: 'private-receipt-internal-marker', email: lead.email,
			};
			const result = { receipt, leadId: lead.id, fingerprint };
			receipts.set(submissionId, result);
			durableWrites.push(copy(lead));
			return { status: 'created', ...result };
		},
		async pushEvent(...args) { record('pushEvent', args); failure('pushEvent'); },
		async saveLead(...args) { record('saveLead', args); failure('saveLead'); },
		hashIdentifier(value) { record('hashIdentifier', [value]); return `hashed:${value}`; },
		async checkRateLimit(...args) {
			record('checkRateLimit', args);
			return { allowed: !options.rateLimited, backend: 'offline', limit: 5, retryAfterSeconds: 45 };
		},
		async scheduleFollowUps(...args) { record('scheduleFollowUps', args); failure('scheduleFollowUps'); },
		async scoreNewLead(...args) { record('scoreNewLead', args); failure('scoreNewLead'); },
		leadData(lead) { record('leadData', [lead]); return { id: lead.id }; },
		async emitJev(...args) { record('emitJev', args); failure('emitJev'); },
		createTransport(...args) {
			record('createTransport', args);
			return { async sendMail(message) {
				record('sendMail', [message]);
				const mailCount = calls.filter(call => call.name === 'sendMail').length;
				if (options.smtpFails || (options.confirmationFails && mailCount === 2)) {
					throw Object.assign(new Error('synthetic-password-marker smtp.example.test private-transport-error'), { code: 'EAUTH' });
				}
				return { messageId: 'synthetic-mail-id' };
			} };
		},
	};
	const module = { exports: {} };
	vm.runInNewContext(code, {
		module, exports: module.exports, __boundary: boundary,
		Request, Response, Headers, FormData, URL, Buffer,
		require(name) {
			assert.equal(name, 'node:crypto', `Unstubbed dependency must not perform I/O: ${name}`);
			return { createHash, randomUUID };
		},
		console: Object.fromEntries(['info', 'warn', 'error'].map(level => [level, (...args) => logs.push({ level, args })])),
		async fetch(url, init) {
			record('fetch', [String(url), { method: init?.method }]);
			assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify', 'Unexpected network boundary');
			assert.equal(init.method, 'POST');
			assert.equal(init.body.get('secret'), env.TURNSTILE_SECRET_KEY);
			if (options.turnstileThrows) throw new Error('synthetic-verification-outage');
			return Response.json({ success: options.turnstileSuccess ?? false });
		},
	});
	return {
		calls, logs, durableWrites,
		count: name => calls.filter(call => call.name === name).length,
		of: name => calls.filter(call => call.name === name),
		async submit({ fields = {}, submissionId = SUBMISSION_ID, method = 'POST', headers = {}, body, encoding = 'json' } = {}) {
			const input = { ...payload, ...fields };
			const requestHeaders = {
				'Content-Type': encoding === 'json' ? 'application/json' : 'application/x-www-form-urlencoded',
				'User-Agent': 'Mozilla/5.0 SyntheticFixtureBrowser',
				'X-Forwarded-For': '192.0.2.20',
				'Referer': 'https://site.example.test/contact/?private=fixture-referrer',
				...headers,
			};
			if (submissionId !== null) requestHeaders['X-Submission-Id'] = submissionId;
			const request = new Request('https://site.example.test/api/contact/', {
				method, headers: requestHeaders,
				...(method === 'GET' ? {} : { body: body ?? (encoding === 'json' ? JSON.stringify(input) : new URLSearchParams(input)) }),
			});
			const response = await module.exports.ALL({ request });
			assert.equal(response.headers.get('cache-control'), 'no-store');
			assert.match(response.headers.get('content-type'), /application\/json/);
			const text = await response.text();
			return { status: response.status, headers: response.headers, body: JSON.parse(text), text };
		},
	};
}

function assertNoReceipt(result) {
	assert.equal(Object.hasOwn(result.body, 'leadAcceptance'), false);
	assert.doesNotMatch(result.text, new RegExp(`${EVENT_ID}|${SUBMISSION_ID}|eventId|leadId|receipt`));
}
function assertMinimalReceipt(result, expected = { ok: true }, eventId = EVENT_ID) {
	assert.deepEqual(result.body, { ...expected, leadAcceptance: { version: 1, eventId } });
	assert.notEqual(result.body.leadAcceptance.eventId, SUBMISSION_ID);
	for (const privateValue of [
		payload.name, payload.email, payload.phone, payload.location, payload.message,
		payload.utm_source, 'fixture-referrer', '192.0.2.20', 'private-receipt-internal-marker',
		'synthetic-password-marker', 'smtp.example.test', 'private-transport-error',
	]) assert.equal(result.text.includes(privateValue), false, `Response leaked ${privateValue}`);
}
function assertNoLeadSideEffects(x) {
	for (const name of ['insertLead', 'insertLeadWithReceipt', 'saveLead', 'pushEvent', 'scheduleFollowUps', 'scoreNewLead', 'emitJev', 'createTransport', 'sendMail']) {
		assert.equal(x.count(name), 0, `Rejected request must not call ${name}`);
	}
	assert.equal(x.durableWrites.length, 0);
}
function assertNoCrmContinuation(x) {
	for (const name of ['insertLead', 'saveLead', 'pushEvent', 'scheduleFollowUps', 'scoreNewLead', 'emitJev']) {
		assert.equal(x.count(name), 0, `Unconfirmed storage must not call ${name}`);
	}
}

test('durably created lead returns exactly the opaque receipt and sends normal inquiry emails', async () => {
	const x = fixture();
	const result = await x.submit();
	assert.equal(result.status, 200);
	assertMinimalReceipt(result);
	assert.equal(x.count('insertLeadWithReceipt'), 1);
	assert.equal(x.count('insertLead'), 0);
	assert.equal(x.durableWrites.length, 1);
	assert.equal(x.count('scheduleFollowUps'), 1);
	assert.equal(x.count('scoreNewLead'), 1);
	assert.equal(x.count('emitJev'), 1);
	assert.equal(x.count('sendMail'), 2);
	assert.deepEqual(x.of('sendMail').map(call => call.args[0].to), ['studio@example.test', 'visitor@example.test']);
	assert.match(x.of('sendMail')[0].args[0].html, /&lt;fixture&gt; &amp; notes/);
	assert.equal(x.of('saveLead')[0].args[0].delivery, 'sent');
	assert.ok(x.of('bumpLedger').some(call => call.args[0] === 'accepted'));
	assert.equal(result.text.includes(x.durableWrites[0].id), false, 'CRM IDs remain private');
	assert.equal(x.count('fetch'), 0);
});

for (const [name, options, input, expectedStatus, expectedBody] of [
	['honeypot', {}, { fields: { website: 'synthetic-bot' } }, 200, { ok: true }],
	['blocklist', { blocked: true }, {}, 200, { ok: true }],
	['invalid email', {}, { fields: { email: 'invalid-address' } }, 422, null],
	['required message missing', {}, { fields: { message: '' } }, 422, null],
	['invalid service', {}, { fields: { service: 'Unlisted service' } }, 422, null],
	['field too long', {}, { fields: { name: 'x'.repeat(101) } }, 422, null],
	['Turnstile rejection', { env: { TURNSTILE_SECRET_KEY: 'synthetic-captcha-secret' } }, { fields: { 'cf-turnstile-response': 'synthetic-token' } }, 403, { ok: false, error: 'verification_failed' }],
	['Turnstile missing token', { env: { TURNSTILE_SECRET_KEY: 'synthetic-captcha-secret' } }, {}, 403, { ok: false, error: 'verification_failed' }],
	['rate limit', { rateLimited: true }, {}, 429, { ok: false, error: 'rate_limited' }],
]) {
	test(`${name} never proves lead acceptance or triggers delivery`, async () => {
		const x = fixture(options);
		const result = await x.submit(input);
		assert.equal(result.status, expectedStatus);
		if (expectedBody) assert.deepEqual(result.body, expectedBody);
		assertNoReceipt(result);
		assertNoLeadSideEffects(x);
		if (expectedStatus === 429) assert.equal(result.headers.get('retry-after'), '45');
	});
}

test('malformed bodies, oversized declared bodies and unsupported methods never return a receipt', async () => {
	for (const [input, status, error] of [
		[{ body: '{invalid json' }, 400, 'invalid_body'],
		[{ headers: { 'content-length': '32001' } }, 413, 'payload_too_large'],
		[{ method: 'GET' }, 405, 'method_not_allowed'],
	]) {
		const x = fixture();
		const result = await x.submit(input);
		assert.equal(result.status, status);
		assert.deepEqual(result.body, { ok: false, error });
		assertNoReceipt(result);
		assertNoLeadSideEffects(x);
	}
});

test('malformed submission identifiers cannot reach persistence, automation or SMTP', async () => {
	for (const submissionId of ['', 'not-a-uuid', 'visitor@example.test', '11111111-2222-3333-8444-555555555555', '11111111-2222-4333-7444-555555555555', `${SUBMISSION_ID}-extra`]) {
		const x = fixture();
		const result = await x.submit({ submissionId });
		assert.equal(result.status, 400);
		assert.deepEqual(result.body, { ok: false, error: 'invalid_submission_id' });
		assertNoReceipt(result);
		assertNoLeadSideEffects(x);
	}
});

test('receipt replay returns the same event without another durable write, automation or email', async () => {
	const x = fixture();
	const first = await x.submit();
	const firstCounts = Object.fromEntries(['insertLead', 'saveLead', 'pushEvent', 'scheduleFollowUps', 'scoreNewLead', 'emitJev', 'createTransport', 'sendMail'].map(name => [name, x.count(name)]));
	const second = await x.submit();
	assert.equal(second.status, 200);
	assertMinimalReceipt(first);
	assertMinimalReceipt(second);
	assert.equal(x.count('insertLeadWithReceipt'), 2, 'A retry consults the atomic receipt boundary');
	assert.equal(x.durableWrites.length, 1);
	for (const [name, count] of Object.entries(firstCounts)) assert.equal(x.count(name), count, `Replay repeated ${name}`);
	assert.equal(x.of('bumpLedger').filter(call => call.args[0] === 'accepted').length, 1);
});

test('a reused submission identifier with a changed inquiry returns conflict without a second side effect', async () => {
	const x = fixture();
	await x.submit();
	const baseline = x.calls.length;
	const result = await x.submit({ fields: { message: 'Different synthetic project' } });
	assert.equal(result.status, 409);
	assert.deepEqual(result.body, { ok: false, error: 'submission_conflict' });
	assertNoReceipt(result);
	assert.equal(x.durableWrites.length, 1);
	assert.equal(x.count('sendMail'), 2);
	assert.equal(x.count('scheduleFollowUps'), 1);
	assert.equal(x.calls.slice(baseline).some(call => ['saveLead', 'pushEvent', 'scoreNewLead', 'emitJev'].includes(call.name)), false);
});

test('a durable conflict response never falls back to ordinary insert or sends mail', async () => {
	const x = fixture({ persistence: 'conflict' });
	const result = await x.submit();
	assert.equal(result.status, 409);
	assertNoReceipt(result);
	assertNoCrmContinuation(x);
	assert.equal(x.count('sendMail'), 0);
});

test('fingerprints bind sanitized contact fields and the form, with no raw contact data in the digest', async () => {
	const x = fixture();
	await x.submit({ fields: { name: `  ${payload.name}  ` } });
	const second = await x.submit();
	assertMinimalReceipt(second);
	assert.equal(x.durableWrites.length, 1, 'Whitespace sanitization preserves retry identity');
	const [first, retry] = x.of('insertLeadWithReceipt');
	assert.equal(first.args[1], SUBMISSION_ID);
	assert.match(first.args[2], /^[0-9a-f]{64}$/);
	assert.equal(first.args[2], retry.args[2]);
	const changedForm = await x.submit({ fields: { form_id: 'project_inquiry' } });
	assert.equal(changedForm.status, 409);
	assertNoReceipt(changedForm);
	assert.notEqual(x.of('insertLeadWithReceipt')[2].args[2], first.args[2]);
});

for (const [label, options, status, expected] of [
	['studio SMTP failure', { smtpFails: true }, 502, { ok: false, error: 'delivery_failed' }],
	['unconfigured SMTP', { env: { SMTP_USER: '', SMTP_PASSWORD: '' } }, 503, { ok: false, error: 'delivery_unavailable' }],
	['visitor confirmation failure', { confirmationFails: true }, 200, { ok: true }],
]) {
	test(`${label} preserves the saved acceptance receipt without leaking transport details`, async () => {
		const x = fixture(options);
		const result = await x.submit();
		assert.equal(result.status, status);
		assertMinimalReceipt(result, expected);
		assert.equal(x.durableWrites.length, 1);
		assert.equal(x.of('saveLead')[0].args[0].delivery, status === 502 ? 'failed' : status === 503 ? 'unavailable' : 'sent');
	});
}

test('a retry after SMTP failure acknowledges the durable receipt without resending email', async () => {
	const x = fixture({ smtpFails: true });
	const first = await x.submit();
	assert.equal(first.status, 502);
	assertMinimalReceipt(first, { ok: false, error: 'delivery_failed' });
	const retry = await x.submit();
	assert.equal(retry.status, 200);
	assertMinimalReceipt(retry);
	assert.equal(x.durableWrites.length, 1);
	assert.equal(x.count('sendMail'), 1);
	assert.equal(x.count('scheduleFollowUps'), 1);
});

for (const failAt of ['bumpLedger:accepted', 'pushEvent', 'scheduleFollowUps', 'scoreNewLead', 'emitJev', 'saveLead']) {
	test(`a post-insert ${failAt} failure cannot revoke the durable receipt`, async () => {
		const x = fixture({ failAt });
		const result = await x.submit();
		assert.equal(result.status, 200);
		assertMinimalReceipt(result);
		assert.equal(x.durableWrites.length, 1);
		assert.equal(x.count('sendMail'), 2);
	});
}

for (const persistence of ['unavailable', 'memory']) {
	for (const [label, options, status, expected] of [
		['working mail', {}, 200, { ok: true }],
		['SMTP failure', { smtpFails: true }, 502, { ok: false, error: 'delivery_failed' }],
		['unconfigured mail', { env: { SMTP_USER: '', SMTP_PASSWORD: '' } }, 503, { ok: false, error: 'delivery_unavailable' }],
	]) {
		test(`${persistence} storage with ${label} keeps mail availability but never proves acceptance`, async () => {
			const x = fixture({ persistence, ...options });
			const result = await x.submit();
			assert.equal(result.status, status);
			assert.deepEqual(result.body, expected);
			assertNoReceipt(result);
			assertNoCrmContinuation(x);
			assert.equal(x.durableWrites.length, 0);
			assert.equal(x.count('sendMail'), status === 200 ? 2 : status === 502 ? 1 : 0);
			assert.equal(x.of('bumpLedger').some(call => call.args[0] === 'accepted'), false);
		});
	}
}

test('an exception at the persistence boundary continues mail without inventing a receipt', async () => {
	const x = fixture({ failAt: 'insertLeadWithReceipt' });
	const result = await x.submit();
	assert.equal(result.status, 200);
	assertNoReceipt(result);
	assertNoCrmContinuation(x);
	assert.equal(x.durableWrites.length, 0);
	assert.equal(x.count('sendMail'), 2);
});

test('legacy JSON and HTML form submissions retain the old success and CRM behavior without receipts', async () => {
	for (const encoding of ['json', 'form']) {
		const x = fixture();
		const result = await x.submit({ submissionId: null, encoding });
		assert.equal(result.status, 200);
		assert.deepEqual(result.body, { ok: true });
		assertNoReceipt(result);
		assert.equal(x.count('insertLead'), 1);
		assert.equal(x.count('insertLeadWithReceipt'), 0);
		assert.equal(x.count('scheduleFollowUps'), 1);
		assert.equal(x.count('sendMail'), 2);
	}
});

test('legacy SMTP failure, missing SMTP and CRM failure keep existing delivery responses without receipts', async () => {
	for (const [options, status, expected] of [
		[{ smtpFails: true }, 502, { ok: false, error: 'delivery_failed' }],
		[{ env: { SMTP_USER: '', SMTP_PASSWORD: '' } }, 503, { ok: false, error: 'delivery_unavailable' }],
		[{ failAt: 'insertLead' }, 200, { ok: true }],
	]) {
		const x = fixture(options);
		const result = await x.submit({ submissionId: null });
		assert.equal(result.status, status);
		assert.deepEqual(result.body, expected);
		assertNoReceipt(result);
		assert.equal(x.count('insertLeadWithReceipt'), 0);
		assert.equal(x.count('insertLead'), 1);
	}
});

test('legitimate repeat contacts with different submission identifiers are still accepted independently', async () => {
	const x = fixture({ repeat: true });
	assertMinimalReceipt(await x.submit());
	assertMinimalReceipt(await x.submit({ submissionId: SECOND_SUBMISSION_ID }), { ok: true }, SECOND_EVENT_ID);
	assert.equal(x.durableWrites.length, 2);
	assert.equal(x.count('sendMail'), 4);
	assert.equal(x.count('scheduleFollowUps'), 2);
	assert.ok(x.durableWrites.every(lead => lead.flags.includes('repeat_submitter')));
});

test('client-supplied receipt fields never establish acceptance or override the durable event identifier', async () => {
	const fields = { leadAcceptance: { version: 1, eventId: SECOND_EVENT_ID }, eventId: SECOND_EVENT_ID, leadId: 'client-claimed-crm-id' };
	const durable = fixture();
	assertMinimalReceipt(await durable.submit({ fields }));
	for (const options of [{ persistence: 'unavailable' }, { persistence: 'memory' }]) {
		const x = fixture(options);
		const result = await x.submit({ fields });
		assert.deepEqual(result.body, { ok: true });
		assertNoReceipt(result);
		assert.equal(result.text.includes(SECOND_EVENT_ID), false);
	}
	const legacy = fixture();
	const result = await legacy.submit({ submissionId: null, fields });
	assert.deepEqual(result.body, { ok: true });
	assertNoReceipt(result);
	assert.equal(result.text.includes(SECOND_EVENT_ID), false);
});

test('a valid Turnstile response reaches durable acceptance through the offline fetch boundary', async () => {
	const x = fixture({ turnstileSuccess: true, env: { TURNSTILE_SECRET_KEY: 'synthetic-captcha-secret' } });
	const result = await x.submit({ fields: { 'cf-turnstile-response': 'synthetic-token' } });
	assert.equal(result.status, 200);
	assertMinimalReceipt(result);
	assert.equal(x.count('fetch'), 1);
	assert.equal(x.durableWrites.length, 1);
});
