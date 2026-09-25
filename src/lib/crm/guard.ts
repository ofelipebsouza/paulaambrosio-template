/**
 * Access guards for the internal API.
 *
 * Four callers exist and each proves itself differently:
 *   · the dashboard  → signed session cookie (auth.ts)
 *   · Hermes (pull)  → `x-hermes-token` compared to HERMES_TOKEN
 *   · Hermes (push)  → HMAC signature over the raw body with HERMES_WEBHOOK_SECRET
 *   · the JEV cron   → CRON_SECRET, in the Bearer header Vercel sends or a query key
 *
 * Every comparison is constant-time; none of them ever echoes the secret back.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readSession, safeEqual } from './auth';

const LOGIN_PATH = '/admin/login/';

export function hasCrmSession(request: Request): boolean {
	return readSession(request);
}

/**
 * Returns `null` when the caller may proceed, otherwise the response to send.
 * Browser navigations are redirected to the login page; API calls get a 401 so
 * the client script can react without following an HTML redirect.
 */
export function requireCrm(request: Request): Response | null {
	if (hasCrmSession(request)) return null;

	const isPage = (request.headers.get('accept') ?? '').includes('text/html');
	if (isPage) {
		const from = new URL(request.url).pathname;
		return Response.redirect(new URL(`${LOGIN_PATH}?from=${encodeURIComponent(from)}`, request.url), 302);
	}
	return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
		status: 401,
		headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
	});
}

/* -------------------------------------------------------------------------- */
/* Hermes                                                                     */
/* -------------------------------------------------------------------------- */

function headerValue(request: Request, name: string): string {
	return (request.headers.get(name) ?? '').trim();
}

/** Hermes authenticates its reads with a bearer/static token. */
export function requireHermes(request: Request): Response | null {
	const expected = String(import.meta.env.HERMES_TOKEN ?? '').trim();
	// A pull endpoint without a secret would expose every inquiry: refuse rather
	// than serve the data unguarded.
	if (!expected) {
		return new Response(JSON.stringify({ ok: false, error: 'hermes_not_configured' }), {
			status: 503,
			headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
		});
	}
	const given = headerValue(request, 'x-hermes-token') || bearer(request);
	if (given && safeEqual(given, expected)) return null;
	return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
		status: 401,
		headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
	});
}

function bearer(request: Request): string {
	const value = headerValue(request, 'authorization');
	return value.toLowerCase().startsWith('bearer ') ? value.slice(7).trim() : '';
}

export function hmacHex(payload: string, secret: string): string {
	return createHmac('sha256', secret).update(payload).digest('hex');
}

export function safeHexEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	try {
		return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
	} catch {
		return false;
	}
}

/**
 * Verifies `x-hermes-signature` (or `x-jev-signature`) over the exact bytes of
 * the body. The raw text is used — re-serialising JSON would change the digest.
 */
export function verifyBodySignature(rawBody: string, signatureHeader: string, secretEnv: string): boolean {
	const secret = String(import.meta.env[secretEnv] ?? '').trim();
	if (!secret) return false;
	const given = (signatureHeader ?? '').trim().replace(/^sha256=/i, '');
	if (!given) return false;
	return safeHexEqual(hmacHex(rawBody, secret), given.toLowerCase());
}

/* -------------------------------------------------------------------------- */
/* Cron / JEV automation                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. JEV may instead call
 * with `?secret=…`. Both are accepted; an unset CRON_SECRET locks the route.
 */
export function requireCron(request: Request): Response | null {
	const expected = String(import.meta.env.CRON_SECRET ?? '').trim();
	if (!expected) {
		return new Response(JSON.stringify({ ok: false, error: 'cron_not_configured' }), {
			status: 503,
			headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
		});
	}
	const url = new URL(request.url);
	const given = bearer(request) || url.searchParams.get('secret') || '';
	if (given && safeEqual(given, expected)) return null;
	return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
		status: 401,
		headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
	});
}
