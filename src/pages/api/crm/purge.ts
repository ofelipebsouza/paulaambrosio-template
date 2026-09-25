/**
 * POST /api/crm/purge/ — wipe all CRM data.
 * x-hermes-token: $HERMES_TOKEN
 * Body: { "confirm": "PURGE_ALL" }
 */
import type { APIRoute } from 'astro';
import { requireHermes } from '../../../lib/crm/guard';
import { crmJson, log } from '../../../lib/crm/http';
import { purgeAll } from '../../../lib/crm/store';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
	if (request.method !== 'POST') return crmJson({ ok: false, error: 'method_not_allowed' }, 405);

	const denied = requireHermes(request);
	if (denied) return denied;

	let body: Record<string, unknown>;
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		return crmJson({ ok: false, error: 'invalid_json' }, 400);
	}

	if (body.confirm !== 'PURGE_ALL') {
		return crmJson({ ok: false, error: 'confirmation_required' }, 422);
	}

	try {
		const result = await purgeAll();
		log('info', 'crm_purge', result);
		return crmJson({ ok: true, ...result });
	} catch (error) {
		log('error', 'crm_purge_failed', { reason: error instanceof Error ? error.message : 'unknown' });
		return crmJson({ ok: false, error: 'purge_failed' }, 500);
	}
};