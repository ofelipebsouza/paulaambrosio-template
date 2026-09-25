/**
 * GET    /api/crm/blocks/ — every rule, newest first.
 * POST   /api/crm/blocks/ — { type: 'ip' | 'email' | 'domain', value, reason? }
 * DELETE /api/crm/blocks/ — same body, removes the rule.
 *
 * The Security panel's API. Rules are exact matches written by the team —
 * auditing beats guessing, so there is no wildcard and no auto-learning: a
 * blocked sender is answered like a success at the contact endpoint and never
 * reaches the pipeline. Removing a rule is immediate.
 */
import type { APIRoute } from 'astro';
import { requireCrm } from '../../../lib/crm/guard';
import { crmJson, log } from '../../../lib/crm/http';
import { deleteBlock, listBlocks, saveBlock, type BlockRule } from '../../../lib/crm/store';

export const prerender = false;

const TYPES: ReadonlyArray<BlockRule['type']> = ['ip', 'email', 'domain'];
const REASON_LIMIT = 120;

function parseRule(body: Record<string, unknown>): BlockRule | { error: string } {
	const rawType = typeof body.type === 'string' ? body.type.trim() : '';
	const type = TYPES.find((candidate) => candidate === rawType);
	if (!type) return { error: 'invalid_type' };

	let value = typeof body.value === 'string' ? body.value.trim().toLowerCase() : '';
	if (!value) return { error: 'missing_value' };

	if (type === 'ip') {
		// IPv4 or IPv6, no spaces, no leading junk — the exact string the
		// contact endpoint compares against `x-forwarded-for`.
		if (!/^[0-9a-f:.]{3,45}$/.test(value)) return { error: 'invalid_ip' };
	} else {
		// Email: full address. Domain: host only, no scheme or path.
		if (type === 'email') {
			if (!/^[^\s@]{1,64}@[^\s@]{1,255}$/.test(value)) return { error: 'invalid_email' };
		} else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(value)) {
			return { error: 'invalid_domain' };
		}
	}

	const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, REASON_LIMIT) : '';
	return { type, value, reason, createdAt: Date.now(), hits: 0 };
}

export const ALL: APIRoute = async ({ request }) => {
	const denied = requireCrm(request);
	if (denied) return denied;

	if (request.method === 'GET') {
		const rules = await listBlocks();
		return crmJson({ ok: true, rules });
	}

	if (request.method !== 'POST' && request.method !== 'DELETE') {
		return crmJson({ ok: false, error: 'method_not_allowed' }, 405);
	}

	let body: Record<string, unknown>;
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		return crmJson({ ok: false, error: 'invalid_body' }, 400);
	}

	const parsed = parseRule(body);
	if ('error' in parsed) return crmJson({ ok: false, error: parsed.error }, 422);

	if (request.method === 'POST') {
		await saveBlock(parsed);
		log('info', 'crm_block_added', { type: parsed.type, reason: parsed.reason || 'unspecified' });
		return crmJson({ ok: true, rule: parsed });
	}

	const removed = await deleteBlock(parsed.type, parsed.value);
	log('info', 'crm_block_removed', { type: parsed.type, removed });
	return crmJson({ ok: true, removed });
};
