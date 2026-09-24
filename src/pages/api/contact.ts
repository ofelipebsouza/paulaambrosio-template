/**
 * POST /api/contact — server-side inquiry endpoint.
 *
 * Pipeline: body limits → parse → honeypot → sanitise → validate → optional
 * Turnstile → rate limit → SMTP delivery (studio lead + visitor confirmation).
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
		return json({ ok: false, error: 'invalid_body' }, 400);
	}

	// 1. Honeypot: answer like a success and send nothing. The visitor never
	//    learns the field existed.
	if (typeof raw[HONEYPOT_FIELD] === 'string' && raw[HONEYPOT_FIELD].trim() !== '') {
		log('warn', 'honeypot_triggered', { requestId });
		return json({ ok: true }, 200);
	}

	// 2. Validate and sanitise every field server-side (the browser is a hint).
	const { payload, errors } = validate(raw);
	if (Object.keys(errors).length > 0) {
		log('info', 'validation_failed', { requestId, fields: Object.keys(errors) });
		return json({ ok: false, error: 'validation_failed', errors }, 422);
	}

	const ip = clientIp(request);

	// 3. Optional CAPTCHA, active only when the secret is configured.
	if (import.meta.env.TURNSTILE_SECRET_KEY) {
		const token = typeof raw[TURNSTILE_FIELD] === 'string' ? String(raw[TURNSTILE_FIELD]) : '';
		if (!(await verifyTurnstile(token, ip, requestId))) {
			return json({ ok: false, error: 'verification_failed' }, 403);
		}
	}

	// 4. Rate limit by hashed visitor identifier.
	const rateLimit = await checkRateLimit(hashIdentifier(ip ?? 'unknown'));
	if (!rateLimit.allowed) {
		log('warn', 'rate_limited', { requestId, backend: rateLimit.backend, limit: rateLimit.limit });
		return json({ ok: false, error: 'rate_limited' }, 429, { 'Retry-After': String(rateLimit.retryAfterSeconds) });
	}

	// 5. Deliver.
	const { transporter, from, recipient, mode } = buildTransport(requestId);
	if (!transporter) {
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
	} catch (error) {
		log('error', 'smtp_delivery_failed', {
			requestId,
			mode,
			host: import.meta.env.SMTP_HOST || 'smtpout.secureserver.net',
			code: (error as { code?: string })?.code ?? 'unknown',
			reason: error instanceof Error ? error.message : 'unknown',
		});
		return json({ ok: false, error: 'delivery_failed' }, 502);
	}

	log('info', 'inquiry_delivered', {
		requestId,
		mode,
		service: payload.service,
		hasPhone: Boolean(payload.phone),
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
