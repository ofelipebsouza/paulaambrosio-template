/**
 * Small HTTP helpers shared by every `/api/crm/*` route.
 *
 * The logging rules of the contact endpoint carry over: JSON, one line per
 * event, a request id when there is one, and never a message body or a full
 * address (`maskEmail` before anything leaves the server).
 */
import { randomUUID } from 'node:crypto';
import { maskEmail } from './schema';

export type Level = 'info' | 'warn' | 'error';

export function log(level: Level, event: string, data: Record<string, unknown> = {}): void {
	console[level](JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

export function newRequestId(): string {
	return randomUUID();
}

export function json(
	body: Record<string, unknown>,
	status: number,
	extraHeaders: Record<string, string> = {},
): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
			...extraHeaders,
		},
	});
}

/** JSON response carrying a `noindex` hint — belt and braces for `/api/crm`. */
export function crmJson(body: Record<string, unknown>, status = 200): Response {
	return json(body, status, { 'X-Robots-Tag': 'noindex' });
}

export function text(body: string, contentType: string, status = 200): Response {
	return new Response(body, {
		status,
		headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
	});
}

/** Logs a lead reference the way the contact endpoint does: masked address. */
export function leadRef(lead: { name: string; email: string }): Record<string, unknown> {
	return { name: lead.name.slice(0, 40), email: maskEmail(lead.email) };
}

export function clientIp(request: Request): string | null {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) return forwarded.split(',')[0].trim() || null;
	return request.headers.get('x-real-ip');
}
