/**
 * GET /api/crm/leads/?status=&q=&limit=&offset= — paged pipeline listing.
 *
 * The team sees full records (name, address, message): that is what a CRM is
 * for, and the route is behind the dashboard session. Nothing here is logged.
 */
import type { APIRoute } from 'astro';
import { requireCrm } from '../../../lib/crm/guard';
import { crmJson } from '../../../lib/crm/http';
import { isLeadStatus } from '../../../lib/crm/schema';
import { listLeads, storeStatus } from '../../../lib/crm/store';

export const prerender = false;

function intParam(url: URL, name: string, fallback: number, max: number): number {
	const parsed = Number.parseInt(url.searchParams.get(name) ?? '', 10);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.min(Math.max(parsed, 0), max);
}

export const ALL: APIRoute = async ({ request }) => {
	if (request.method !== 'GET') return crmJson({ ok: false, error: 'method_not_allowed' }, 405);

	const denied = requireCrm(request);
	if (denied) return denied;

	const url = new URL(request.url);
	const statusParam = url.searchParams.get('status');
	if (statusParam && !isLeadStatus(statusParam)) {
		return crmJson({ ok: false, error: 'invalid_status' }, 422);
	}

	const page = await listLeads({
		status: isLeadStatus(statusParam) ? statusParam : null,
		query: url.searchParams.get('q') ?? '',
		limit: intParam(url, 'limit', 50, 500),
		offset: intParam(url, 'offset', 0, 100_000),
	});

	return crmJson({ ok: true, ...page, storage: storeStatus() });
};
