/**
 * POST /api/analytics/collect — anonymous event and pageview tracking endpoint.
 *
 * Lightweight, best-effort ingestion into Upstash Redis for studio dashboard visibility.
 */
import type { APIRoute } from 'astro';
import { recordPageView, recordEvent } from '../../../lib/analytics/store';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		const data = (await request.json().catch(() => ({}))) as {
			page?: string;
			event?: string;
			referrer?: string;
		};

		const page = String(data.page || '/').slice(0, 200);
		const event = data.event ? String(data.event).slice(0, 100) : null;
		const referrer = data.referrer ? String(data.referrer).slice(0, 300) : undefined;

		if (event) {
			await recordEvent(event, page);
		} else {
			await recordPageView(page, referrer);
		}

		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
		});
	} catch {
		return new Response(JSON.stringify({ ok: false }), { status: 400 });
	}
};
