/**
 * GET /api/crm/analytics/ — Summary of studio metrics for Admin.
 */
import type { APIRoute } from 'astro';
import { requireCrm } from '../../../lib/crm/guard';
import { crmJson } from '../../../lib/crm/http';
import { getAnalyticsSummary } from '../../../lib/analytics/store';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
	if (request.method !== 'GET') return crmJson({ ok: false, error: 'method_not_allowed' }, 405);

	const denied = requireCrm(request);
	if (denied) return denied;

	const summary = await getAnalyticsSummary(30);
	return crmJson({ ok: true, summary });
};
