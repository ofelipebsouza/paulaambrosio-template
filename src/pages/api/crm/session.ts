/**
 * POST /api/crm/session/ — open a dashboard session.
 * DELETE /api/crm/session/ — close it.
 * GET /api/crm/session/ — whether the caller already has a valid session.
 *
 * The login attempt is rate limited per IP with the same distributed limiter
 * the inquiry endpoint uses, so a guess storm costs the attacker the same it
 * costs a visitor: 5 tries per 10 minutes by default.
 */
import type { APIRoute } from 'astro';
import { checkRateLimit, hashIdentifier } from '../../../lib/rate-limit';
import {
	clearSessionCookie,
	createSessionToken,
	passwordConfigured,
	passwordMatches,
	readSession,
	sessionCookie,
} from '../../../lib/crm/auth';
import { clientIp, json, log } from '../../../lib/crm/http';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
	if (request.method === 'GET') {
		return json({ ok: true, authenticated: readSession(request) }, 200);
	}

	if (request.method === 'DELETE') {
		return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(request.url) });
	}

	if (request.method !== 'POST') {
		return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'GET, POST, DELETE' });
	}

	if (!passwordConfigured()) {
		// Refuse loudly instead of accepting any password when unset.
		log('error', 'crm_password_missing', {
			detail: 'Set CRM_PASSWORD in the Vercel environment variables to enable the dashboard.',
		});
		return json({ ok: false, error: 'crm_not_configured' }, 503);
	}

	const ip = clientIp(request) ?? 'unknown';
	const limit = await checkRateLimit(hashIdentifier(`crm:${ip}`));
	if (!limit.allowed) {
		log('warn', 'crm_login_rate_limited', { backend: limit.backend });
		return json({ ok: false, error: 'rate_limited' }, 429, { 'Retry-After': String(limit.retryAfterSeconds) });
	}

	let password = '';
	try {
		const body = (await request.json()) as { password?: unknown };
		password = typeof body.password === 'string' ? body.password : '';
	} catch {
		return json({ ok: false, error: 'invalid_body' }, 400);
	}

	if (!password || !passwordMatches(password)) {
		log('warn', 'crm_login_failed', { attempts: limit.remaining });
		return json({ ok: false, error: 'invalid_credentials' }, 401);
	}

	log('info', 'crm_login_succeeded', {});
	return json({ ok: true, authenticated: true }, 200, {
		'Set-Cookie': sessionCookie(createSessionToken(), request.url),
	});
};
