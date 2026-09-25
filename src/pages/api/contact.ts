/**
 * POST /api/contact — server-side inquiry endpoint.
 *
 * Pipeline: body limits → parse → honeypot → sanitise → validate → optional
 * Turnstile → rate limit → blocklist → CRM store (with enrichment) → SMTP
 * delivery (studio lead + visitor confirmation).
 *
 * Every outcome increments the daily submission ledger (`attempts`,
 * `accepted`, `honeypot`, `blocked`, …) so the dashboard can reconcile what
 * the server saw against what Vercel Analytics reports.
 *
 * Rules that must not be relaxed:
 *  - no credential or SMTP detail ever reaches the browser or an error message;
 *  - visitor input is escaped before it enters the HTML email;
 *  - SMTP failures are logged with a request id and answered with a generic
 *    message, never with the transport error;
 *  - the endpoint never logs message bodies or full addresses.
 */
import type { APIRoute } from 'astro';
import nodemailer, { type Transporter } from 'nodemailer';
import { randomUUID } from 'node:crypto';
import {
	CONTACT_FIELDS,
	FIELD_LIMITS,
	HONEYPOT_FIELD,
	TURNSTILE_FIELD,
	type ContactFieldName,
	type ContactFieldSpec,
} from '../../lib/contact-form';
import { composeConfirmationEmail, composeLeadEmail, type ContactPayload } from '../../lib/contact-email';
import { checkRateLimit, hashIdentifier } from '../../lib/rate-limit';
import { buildLead, newId, type CrmLead } from '../../lib/crm/schema';
import { bumpLedger, findBlock, countBlockHit, findLeadByEmail, insertLead, pushEvent, saveLead } from '../../lib/crm/store';
import { emitJev, leadData, scheduleFollowUps } from '../../lib/crm/automation';
import { buildEnrichment } from '../../lib/crm/enrichment';

/** On-demand route: the rest of the site stays statically generated. */
export const prerender = false;

const MAX_BODY_BYTES = 32_000;
const SENDER_NAME = 'Paula Ambrosio Website';

type Level = 'info' | 'warn' | 'error';

function log(level: Level, event: string, data: Record<string, unknown> = {}): void {
	console[level](JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

function json(body: Record<string, unknown>, status: number, extraHeaders: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
			...extraHeaders,
		},
	});
}

/* -------------------------------------------------------------------------- */
/* Sanitising + validation                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Removes control characters and the line breaks a single-line field cannot
 * hold. Length is checked afterwards (in `validate`) so an oversized field is
 * reported to the visitor instead of being silently cut in half.
 */
function sanitize(value: unknown, spec: ContactFieldSpec): string {
	if (typeof value !== 'string') return '';
	let clean = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
	if (spec.multiline) {
		clean = clean.replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
	} else {
		clean = clean.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
	}
	return clean;
}

function isEmail(value: string): boolean {
	// Deliberately strict but pragmatic: no spaces, a single @, a dotted domain.
	return /^[^\s@"'<>]{1,64}@[^\s@"'<>.]{1,63}(?:\.[^\s@"'<>.]{2,63})+$/.test(value);
}

interface ValidationResult {
	payload: ContactPayload;
	errors: Partial<Record<ContactFieldName, string>>;
}

function validate(raw: Record<string, unknown>): ValidationResult {
	const payload = {} as ContactPayload;
	const errors: Partial<Record<ContactFieldName, string>> = {};

	for (const spec of CONTACT_FIELDS) {
		const value = sanitize(raw[spec.name], spec);
		payload[spec.name] = value;

		if (spec.required && !value) {
			// Location and service are required on the comprehensive /contact/ page,
			// but optional on compact forms like the project inquiry modal.
			if (
				(spec.name === 'location' || spec.name === 'service') &&
				(raw[spec.name] === undefined || raw.form_id === 'project_inquiry' || raw.form === 'project_inquiry')
			) {
				continue;
			}
			errors[spec.name] = `${spec.label} is required.`;
			continue;
		}
		if (!value) continue;

		if (value.length > FIELD_LIMITS[spec.name]) {
			errors[spec.name] = `${spec.label} must be ${FIELD_LIMITS[spec.name]} characters or fewer.`;
			continue;
		}
		if (spec.name === 'email' && !isEmail(value)) {
			errors.email = 'Please enter a valid email address.';
			continue;
		}
		if (spec.options && !spec.options.includes(value)) {
			errors[spec.name] = `Please choose one of the listed ${spec.label.toLowerCase()} options.`;
		}
	}

	return { payload, errors };
}

/* -------------------------------------------------------------------------- */
/* Spam protection                                                            */
/* -------------------------------------------------------------------------- */

async function verifyTurnstile(token: string, ip: string | null, requestId: string): Promise<boolean> {
	const secret = import.meta.env.TURNSTILE_SECRET_KEY;
	if (!secret) return true;

	if (!token) {
		log('warn', 'turnstile_missing_token', { requestId });
		return false;
	}

	try {
		const body = new FormData();
		body.set('secret', String(secret));
		body.set('response', token);
		if (ip) body.set('remoteip', ip);

		const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			body,
		});
		const result = (await response.json()) as { success?: boolean; 'error-codes'?: string[] };
		if (!result.success) {
			log('warn', 'turnstile_rejected', { requestId, codes: result['error-codes'] ?? [] });
			return false;
		}
		return true;
	} catch (error) {
		// A Cloudflare outage must not swallow real inquiries.
		log('error', 'turnstile_unreachable', {
			requestId,
			reason: error instanceof Error ? error.message : 'unknown',
		});
		return true;
	}
}

function clientIp(request: Request): string | null {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) return forwarded.split(',')[0].trim() || null;
	return request.headers.get('x-real-ip');
}

/* -------------------------------------------------------------------------- */
/* Transport                                                                  */
/* -------------------------------------------------------------------------- */

interface TransportSetup {
	transporter: Transporter | null;
	from: string;
	recipient: string;
	mode: 'smtp' | 'json' | 'unconfigured';
}

function buildTransport(requestId: string): TransportSetup {
	const user = import.meta.env.SMTP_USER;
	const password = import.meta.env.SMTP_PASSWORD;
	const recipient = import.meta.env.CONTACT_RECIPIENT_EMAIL || user || 'info@paulaambrosio.com';
	const forcedMode = import.meta.env.CONTACT_MAIL_MODE;

	if (forcedMode === 'json') {
		log('warn', 'mail_mode_json', { requestId, detail: 'Emails are serialised to the server log instead of sent.' });
		return {
			transporter: nodemailer.createTransport({ jsonTransport: true }),
			from: user ? `"${SENDER_NAME}" <${user}>` : `"${SENDER_NAME}" <${recipient}>`,
			recipient,
			mode: 'json',
		};
	}

	if (!user || !password) {
		log('error', 'smtp_not_configured', {
			requestId,
			detail: 'SMTP_USER/SMTP_PASSWORD are missing; configure the Vercel environment variables.',
		});
		return { transporter: null, from: '', recipient, mode: 'unconfigured' };
	}

	const port = Number.parseInt(String(import.meta.env.SMTP_PORT ?? '465'), 10);
	const secure = String(import.meta.env.SMTP_SECURE ?? 'true').toLowerCase() !== 'false';

	// GoDaddy Professional Email (Titan) defaults; every value is overridable so
	// switching to Microsoft 365 is an environment change, not a code change.
	const transporter = nodemailer.createTransport({
		host: import.meta.env.SMTP_HOST || 'smtpout.secureserver.net',
		port: Number.isFinite(port) ? port : 465,
		secure,
		auth: { user, pass: password },
		requireTLS: !secure,
		connectionTimeout: 10_000,
		greetingTimeout: 10_000,
		socketTimeout: 20_000,
		pool: false,
	});

	return { transporter, from: `"${SENDER_NAME}" <${user}>`, recipient, mode: 'smtp' };
}

/* -------------------------------------------------------------------------- */
/* Route                                                                      */
/* -------------------------------------------------------------------------- */

export const ALL: APIRoute = async ({ request }) => {
	if (request.method !== 'POST') {
		return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
	}

	const requestId = randomUUID();

	const declaredLength = Number.parseInt(request.headers.get('content-length') ?? '0', 10);
	if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
		log('warn', 'payload_too_large', { requestId, declaredLength });
		return json({ ok: false, error: 'payload_too_large' }, 413);
	}

	let raw: Record<string, unknown>;
	try {
		const contentType = request.headers.get('content-type') ?? '';
		if (contentType.includes('application/json')) {
			raw = (await request.json()) as Record<string, unknown>;
		} else {
			const form = await request.formData();
			raw = Object.fromEntries(form.entries());
		}
	} catch (error) {
		log('warn', 'unparsable_body', { requestId, reason: error instanceof Error ? error.message : 'unknown' });
		await bumpLedger('attempts');
		return json({ ok: false, error: 'invalid_body' }, 400);
	}

	// The ledger counts every body that parsed, whatever happens next — the
	// number the dashboard puts beside Vercel's `form_submit`.
	await bumpLedger('attempts');

	// 1. Honeypot: answer like a success and send nothing. The visitor never
	//    learns the field existed.
	if (typeof raw[HONEYPOT_FIELD] === 'string' && raw[HONEYPOT_FIELD].trim() !== '') {
		log('warn', 'honeypot_triggered', { requestId });
		await bumpLedger('honeypot');
		return json({ ok: true }, 200);
	}

	// 2. Validate and sanitise every field server-side (the browser is a hint).
	const { payload, errors } = validate(raw);
	if (Object.keys(errors).length > 0) {
		log('info', 'validation_failed', { requestId, fields: Object.keys(errors) });
		await bumpLedger('rejected_validation');
		return json({ ok: false, error: 'validation_failed', errors }, 422);
	}

	const ip = clientIp(request);

	// Where the inquiry came from: the modal and the contact page share this
	// endpoint, and the CRM reports them separately.
	const formId =
		(typeof raw.form_id === 'string' && raw.form_id.trim()) ||
		(typeof raw.form === 'string' && raw.form.trim()) ||
		'contact';
	let page = '/';
	const referer = request.headers.get('referer');
	if (referer) {
		try {
			page = new URL(referer).pathname || '/';
		} catch {
			// A malformed referer is not worth a log line.
		}
	}

	// 3. Optional CAPTCHA, active only when the secret is configured.
	if (import.meta.env.TURNSTILE_SECRET_KEY) {
		const token = typeof raw[TURNSTILE_FIELD] === 'string' ? String(raw[TURNSTILE_FIELD]) : '';
		if (!(await verifyTurnstile(token, ip, requestId))) {
			await bumpLedger('turnstile');
			return json({ ok: false, error: 'verification_failed' }, 403);
		}
	}

	// 4. Blocklist — a rule the team wrote on the Security panel. Answer exactly
	//    like a success: a blocked sender must not learn that a rule exists. No
	//    lead is written and no mail is sent; only the hit is counted.
	const email = String(payload.email ?? '').toLowerCase().trim();
	const blocked = await findBlock(ip ?? '', email).catch(() => null);
	if (blocked) {
		log('warn', 'blocked_submission', { requestId, rule: blocked.type });
		await Promise.all([bumpLedger('blocked'), countBlockHit(blocked).catch(() => undefined)]);
		return json({ ok: true }, 200);
	}

	// 5. Rate limit by hashed visitor identifier.
	const rateLimit = await checkRateLimit(hashIdentifier(ip ?? 'unknown'));
	if (!rateLimit.allowed) {
		log('warn', 'rate_limited', { requestId, backend: rateLimit.backend, limit: rateLimit.limit });
		await bumpLedger('rejected_rate');
		return json({ ok: false, error: 'rate_limited' }, 429, { 'Retry-After': String(rateLimit.retryAfterSeconds) });
	}

	// 6. Store the lead before delivering it. The team's pipeline must survive
	//    an SMTP outage, and the CRM write is best effort: a Redis hiccup never
	//    changes the answer the visitor gets.
	let crmLead: CrmLead | null = null;
	try {
		// Enrichment consults the email index: a repeat submission from the same
		// address is flagged for review, never suppressed.
		const repeat = Boolean(await findLeadByEmail(payload.email).catch(() => null));
		crmLead = buildLead({
			payload,
			form: formId,
			page,
			id: newId(),
			now: Date.now(),
			context: buildEnrichment({ request, ip: ip ?? '', raw, repeatSubmitter: repeat }),
		});
		await insertLead(crmLead);
		await bumpLedger('accepted');
		await pushEvent(crmLead.id, {
			ts: crmLead.createdAt,
			type: 'created',
			detail: `Received from ${page} (${formId})`,
			actor: 'system',
		});
		if (crmLead.flags.length) {
			await pushEvent(crmLead.id, {
				ts: crmLead.createdAt,
				type: 'created',
				detail: `Flagged for review: ${crmLead.flags.join(', ')}`,
				actor: 'system',
			});
		}
		await scheduleFollowUps(crmLead, crmLead.createdAt);
		await emitJev('lead.created', leadData(crmLead), crmLead.createdAt);
	} catch (error) {
		log('warn', 'crm_store_failed', {
			requestId,
			reason: error instanceof Error ? error.message : 'unknown',
		});
		crmLead = null;
	}

	// 7. Deliver.
	const { transporter, from, recipient, mode } = buildTransport(requestId);
	if (!transporter) {
		if (crmLead) {
			crmLead.delivery = 'unavailable';
			await saveLead(crmLead).catch(() => undefined);
		}
		return json({ ok: false, error: 'delivery_unavailable' }, 503);
	}

	const lead = composeLeadEmail(payload, recipient);

	try {
		await transporter.sendMail({
			from,
			to: recipient,
			replyTo: `"${payload.name}" <${payload.email}>`,
			subject: lead.subject,
			text: lead.text,
			html: lead.html,
		});
		if (crmLead) {
			crmLead.delivery = 'sent';
			crmLead.updatedAt = Date.now();
			await saveLead(crmLead).catch(() => undefined);
		}
	} catch (error) {
		log('error', 'smtp_delivery_failed', {
			requestId,
			mode,
			host: import.meta.env.SMTP_HOST || 'smtpout.secureserver.net',
			code: (error as { code?: string })?.code ?? 'unknown',
			reason: error instanceof Error ? error.message : 'unknown',
		});
		await bumpLedger('smtp_failed');
		if (crmLead) {
			crmLead.delivery = 'failed';
			crmLead.updatedAt = Date.now();
			await saveLead(crmLead).catch(() => undefined);
			await pushEvent(crmLead.id, {
				ts: crmLead.updatedAt,
				type: 'delivery',
				detail: 'Studio notification was not accepted by the mail server',
				actor: 'system',
			}).catch(() => undefined);
		}
		return json({ ok: false, error: 'delivery_failed' }, 502);
	}

	log('info', 'inquiry_delivered', {
		requestId,
		mode,
		service: payload.service,
		hasPhone: Boolean(payload.phone),
		form: formId,
		crm: Boolean(crmLead),
	});

	// The confirmation is a courtesy: if it fails the lead is already safe.
	try {
		const confirmation = composeConfirmationEmail(payload);
		await transporter.sendMail({
			from,
			to: payload.email,
			subject: confirmation.subject,
			text: confirmation.text,
			html: confirmation.html,
		});
	} catch (error) {
		log('warn', 'confirmation_failed', {
			requestId,
			reason: error instanceof Error ? error.message : 'unknown',
		});
	}

	return json({ ok: true }, 200);
};
