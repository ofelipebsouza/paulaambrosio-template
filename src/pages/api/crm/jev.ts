/**
 * GET  /api/crm/jev/ — whether JEV is configured and how much of the pipeline
 *                      has been scored (the dashboard shows this as coverage).
 * POST /api/crm/jev/ — { action: 'classify', id } scores one lead,
 *                      { action: 'backfill', limit?, force? } scores the
 *                      leads that have no score yet.
 *
 * Scoring is a best-effort enrichment: a failure here reports `scored: 0` and
 * leaves every lead exactly as it was. Guarded by the dashboard session, and
 * like every `/api/crm` route it never echoes a message body.
 */
import type { APIRoute } from 'astro';
import { scoreLead, jevConfigured } from '../../../lib/crm/jev';
import { requireCrm } from '../../../lib/crm/guard';
import { crmJson, log } from '../../../lib/crm/http';
import { allLeads, getLead, storeStatus } from '../../../lib/crm/store';

export const prerender = false;

/** One call classifies at most this many leads — the route is synchronous. */
const BACKFILL_DEFAULT = 15;
const BACKFILL_MAX = 40;
/** Backfill can afford to wait where the contact form cannot. */
const BACKFILL_TIMEOUT_MS = 8000;

function coverage(leads: Awaited<ReturnType<typeof allLeads>>): Record<string, number> {
	const counts: Record<string, number> = { scored: 0, hot: 0, warm: 0, cold: 0, spam: 0 };
	for (const lead of leads) {
		if (!lead.jev) continue;
		counts.scored += 1;
		counts[lead.jev.temperature] = (counts[lead.jev.temperature] ?? 0) + 1;
	}
	return counts;
}

export const ALL: APIRoute = async ({ request }) => {
	const denied = requireCrm(request);
	if (denied) return denied;

	const configured = jevConfigured();

	if (request.method === 'GET') {
		const leads = await allLeads();
		return crmJson({
			ok: true,
			configured,
			total: leads.length,
			...coverage(leads),
			storage: storeStatus(),
		});
	}

	if (request.method !== 'POST') return crmJson({ ok: false, error: 'method_not_allowed' }, 405);

	let body: Record<string, unknown>;
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		body = {};
	}

	if (!configured) return crmJson({ ok: false, error: 'jev_not_configured' }, 503);

	const now = Date.now();

	/* One lead, on demand (the dialog's "Reclassify" button). -------------- */
	if (body.action === 'classify') {
		const id = String(body.id ?? '');
		if (!id) return crmJson({ ok: false, error: 'missing_id' }, 400);
		const lead = await getLead(id);
		if (!lead) return crmJson({ ok: false, error: 'not_found' }, 404);

		const scored = await scoreLead(lead, { timeoutMs: BACKFILL_TIMEOUT_MS, now, force: true });
		if (!scored) return crmJson({ ok: false, error: 'jev_unavailable' }, 502);
		return crmJson({ ok: true, id, jev: lead.jev });
	}

	/* Everything that has no score yet. ------------------------------------ */
	if (body.action === 'backfill') {
		const limitRaw = Number.parseInt(String(body.limit ?? ''), 10);
		const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), BACKFILL_MAX) : BACKFILL_DEFAULT;
		const force = body.force === true;

		const leads = await allLeads();
		const pending = (force ? [...leads] : leads.filter((lead) => !lead.jev))
			.sort((a, b) => b.createdAt - a.createdAt)
			.slice(0, limit);

		let scored = 0;
		let failed = 0;
		for (const lead of pending) {
			const classified = await scoreLead(lead, { timeoutMs: BACKFILL_TIMEOUT_MS, now: Date.now(), force });
			if (!classified) {
				failed += 1;
				continue;
			}
			scored += 1;
		}

		const remaining = (await allLeads()).filter((lead) => !lead.jev).length;
		log('info', 'jev_backfill', { scored, failed, remaining });
		return crmJson({ ok: true, requested: pending.length, scored, failed, remaining });
	}

	return crmJson({ ok: false, error: 'unknown_action' }, 422);
};
