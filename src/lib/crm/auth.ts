/**
 * Dashboard authentication — password in an env var, session in a signed cookie.
 *
 * Deliberately no third-party identity provider: the CRM is for one studio
 * team, the deployment is already serverless, and a signed token keeps the
 * whole access control inspectable in this file.
 *
 *   CRM_PASSWORD        required — the team credential
 *   CRM_SESSION_SECRET  recommended — HMAC key for the cookie
 *   CRM_SESSION_TTL     optional — seconds (default 12 h)
 *
 * Without CRM_SESSION_SECRET the key is derived from the password so a
 * one-variable setup still works, but a warning is logged once: a dedicated
 * secret lets the password be rotated without invalidating every session.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { parseCookie, stringifySetCookie } from 'cookie';

export const SESSION_COOKIE = 'crm_session';
const DEFAULT_TTL_SECONDS = 12 * 60 * 60;
const TOKEN_VERSION = 'v1';

let warnedAboutDerivedSecret = false;

function env(name: string): string {
	return String(import.meta.env[name] ?? '').trim();
}

export function passwordConfigured(): boolean {
	return env('CRM_PASSWORD').length > 0;
}

export function sessionTtlSeconds(): number {
	const parsed = Number.parseInt(env('CRM_SESSION_TTL'), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TTL_SECONDS;
}

function sessionSecret(): string {
	const explicit = env('CRM_SESSION_SECRET');
	if (explicit) return explicit;
	if (!warnedAboutDerivedSecret) {
		warnedAboutDerivedSecret = true;
		console.warn(
			JSON.stringify({
				event: 'crm_session_secret_derived',
				detail: 'CRM_SESSION_SECRET is not set — sessions are keyed on CRM_PASSWORD. Set a dedicated secret.',
			}),
		);
	}
	return `derived:${env('CRM_PASSWORD')}`;
}

/** Constant-time comparison that never leaks length through an early exit. */
export function safeEqual(a: string, b: string): boolean {
	const left = Buffer.from(a, 'utf8');
	const right = Buffer.from(b, 'utf8');
	if (left.length !== right.length) {
		// Compare against itself so the work happens either way.
		timingSafeEqual(left, left);
		return false;
	}
	return timingSafeEqual(left, right);
}

export function passwordMatches(provided: string): boolean {
	const expected = env('CRM_PASSWORD');
	if (!expected) return false;
	return safeEqual(provided, expected);
}

/* -------------------------------------------------------------------------- */
/* Token                                                                      */
/* -------------------------------------------------------------------------- */

function sign(payload: string): string {
	return createHmac('sha256', sessionSecret()).update(`${TOKEN_VERSION}:${payload}`).digest('hex');
}

/** `exp.timestamp.signature` — verifiable without a lookup table. */
export function createSessionToken(now = Date.now()): string {
	const exp = Math.floor(now / 1000) + sessionTtlSeconds();
	const payload = String(exp);
	return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null, now = Date.now()): boolean {
	if (!token) return false;
	const [expRaw, signature, ...rest] = token.split('.');
	if (!expRaw || !signature || rest.length) return false;

	const expected = sign(expRaw);
	const given = Buffer.from(signature, 'utf8');
	const want = Buffer.from(expected, 'utf8');
	if (given.length !== want.length) return false;
	if (!timingSafeEqual(given, want)) return false;

	const exp = Number.parseInt(expRaw, 10);
	return Number.isFinite(exp) && exp * 1000 > now;
}

/* -------------------------------------------------------------------------- */
/* Cookie                                                                     */
/* -------------------------------------------------------------------------- */

export function readSession(request: Request): boolean {
	const header = request.headers.get('cookie');
	if (!header) return false;
	const jar = parseCookie(header);
	return verifySessionToken(jar[SESSION_COOKIE]);
}

/**
 * `Set-Cookie` value for a fresh session. HttpOnly keeps it out of JS and
 * SameSite=Lax keeps it off cross-site requests; `Secure` follows the protocol
 * the request arrived on so local HTTP development still works.
 */
export function sessionCookie(token: string, requestUrl: string): string {
	return stringifySetCookie({
		name: SESSION_COOKIE,
		value: token,
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: sessionTtlSeconds(),
		secure: requestUrl.startsWith('https://'),
	});
}

export function clearSessionCookie(requestUrl: string): string {
	return stringifySetCookie({
		name: SESSION_COOKIE,
		value: '',
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 0,
		secure: requestUrl.startsWith('https://'),
	});
}
