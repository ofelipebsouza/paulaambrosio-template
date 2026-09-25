/**
 * GET /api/crm/metrics/ — aggregated KPIs for the dashboard, plus the daily
 * submission ledger (what the server actually did) so the page can put its
 * numbers next to Vercel Analytics without a second request.
 *
 * Protected by the dashboard session. Reads are not cached by the browser
 * (`Cache-Control: no-store`) because the numbers are the whole point of the
 * page; the client polls on its own rhythm.
 */
import type { APIRoute } from 'astro';
import { requireCrm } from '../../../lib/crm/guard';
import { crmJson, log } from '../../../lib/crm/http';
import { buildMetrics, responseRate } from '../../../lib/crm/metrics';
import { dailyCounts, allLeads, ledgerCounts, listTasks, storeStatus } from '../../../lib/crm/store';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
	if (request.method !== 'GET') return crmJson({ ok: false, error: 'method_not_allowed' }, 405);

	const denied = requireCrm(request);
	if (denied) return denied;

	try {
		const now = Date.now();
		const [leads, tasks, daily, ledger] = await Promise.all([
			allLeads(),
			listTasks(),
			dailyCounts(30),
			ledgerCounts(14),
		]);
		const metrics = buildMetrics({ leads, tasks, daily, now });

		return crmJson({
			ok: true,
			metrics: {
				...metrics,
				answeredWithin24h: responseRate(leads, 24, now),
			},
			ledger,
			storage: storeStatus(),
			generatedAt: now,
		});
	} catch (error) {
		log('error', 'crm_metrics_failed', { reason: error instanceof Error ? error.message : 'unknown' });
		return crmJson({ ok: false, error: 'metrics_unavailable' }, 500);
	}
};
