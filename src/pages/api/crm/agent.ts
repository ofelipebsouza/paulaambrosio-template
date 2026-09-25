/**
 * POST /api/crm/agent/ — Hermes acting on a lead.
 *
 * This is the "hybrid" half of the pipeline: the agent picks up a card, moves
 * it, leaves a note or marks a reply, exactly like a person would — through
 * the same `applyLeadPatch` validation — but always recorded with
 * `actor: 'hermes'` in the timeline, so the team can see who touched what.
 *
 * Credentials (constant-time, never echoed):
 *   · `x-hermes-token: $HERMES_TOKEN`, or
 *   · `x-hermes-signature: sha256=HMAC-SHA256(rawBody, HERMES_WEBHOOK_SECRET)`
 *
 * Deliberately out of scope: deleting leads, erasing notes, touching another
 * studio's data. An agent that can only move, note and answer cannot cover
 * its tracks, and every action is auditable.
 *
 * Body: { leadId, action: 'move' | 'note' | 'responded' | 'assign', status?, text?, to? }
 */
import type { APIRoute } from 'astro';
import { emitJev, leadData } from '../../../lib/crm/automation';
import { requireHermes, verifyBodySignature } from '../../../lib/crm/guard';
import { crmJson, clientIp, json, log } from '../../../lib/crm/http';
import { applyLeadPatch } from '../../../lib/crm/lead-actions';
import { isLeadStatus, normalizeStatus } from '../../../lib/crm/schema';
import {
	getLead,
	listTasks,
	pushEvent,
	saveLead,
	saveTask,
} from '../../../lib/crm/store';
import { checkRateLimit, hashIdentifier } from '../../../lib/rate-limit';

export const prerender = false;

const TEXT_LIMIT = 600;
const ACTIONS = ['move', 'note', 'responded', 'assign'] as const;
type AgentAction = (typeof ACTIONS)[number];

export const ALL: APIRoute = async ({ request }) => {
	if (request.method !== 'POST') return crmJson({ ok: false, error: 'method_not_allowed' }, 405);

	/* Auth ---------------------------------------------------------------- */
	const secretConfigured = Boolean(String(import.meta.env.HERMES_WEBHOOK_SECRET ?? '').trim());
	const rawBody = await request.text();
	const signed = verifyBodySignature(
		rawBody,
		request.headers.get('x-hermes-signature') ?? '',
		'HERMES_WEBHOOK_SECRET',
	);
	// With a webhook secret configured a signature is mandatory; without one
	// the static token is the only credential there is (same rule as report).
	if (secretConfigured) {
		if (!signed) {
			log('warn', 'crm_agent_rejected', { reason: 'bad_signature' });
			return crmJson({ ok: false, error: 'unauthorized' }, 401);
		}
	} else {
		// Falls through with 401 (bad token) or 503 (HERMES_TOKEN unset):
		// an unconfigured agent route must refuse, never open.
		const denied = requireHermes(request);
		if (denied) return denied;
	}

	/* Rate limit ---------------------------------------------------------- */
	// A dedicated scope and quota: the agent may move a dozen cards in a row,
	// and must never consume the visitors' contact-window budget.
	const ip = clientIp(request) ?? 'unknown';
	const limit = await checkRateLimit(hashIdentifier(`crm:agent:${ip}`), {
		scope: 'crm-agent',
		limit: 60,
		windowSeconds: 60,
	});
	if (!limit.allowed) {
		log('warn', 'crm_agent_rate_limited', { backend: limit.backend });
		return json({ ok: false, error: 'rate_limited' }, 429, { 'Retry-After': String(limit.retryAfterSeconds), 'X-Robots-Tag': 'noindex' });
	}

	/* Body ---------------------------------------------------------------- */
	let body: Record<string, unknown>;
	try {
		body = JSON.parse(rawBody) as Record<string, unknown>;
	} catch {
		return crmJson({ ok: false, error: 'invalid_json' }, 400);
	}

	const leadId = typeof body.leadId === 'string' ? body.leadId.trim() : '';
	const action = typeof body.action === 'string' ? (body.action.trim() as AgentAction) : ('' as AgentAction);
	if (!leadId) return crmJson({ ok: false, error: 'missing_lead_id' }, 400);
	if (!ACTIONS.includes(action)) return crmJson({ ok: false, error: 'invalid_action' }, 422);

	const lead = await getLead(leadId);
	if (!lead) return crmJson({ ok: false, error: 'not_found' }, 404);

	/* Translate the action into the shared patch --------------------------- */
	const patch: Record<string, unknown> = {};
	switch (action) {
		case 'move': {
			if (!isLeadStatus(body.status)) return crmJson({ ok: false, error: 'invalid_status' }, 422);
			patch.status = body.status;
			break;
		}
		case 'note': {
			const text = typeof body.text === 'string' ? body.text.trim().slice(0, TEXT_LIMIT) : '';
			if (!text) return crmJson({ ok: false, error: 'empty_note' }, 422);
			patch.note = text;
			break;
		}
		case 'responded': {
			patch.responded = true;
			break;
		}
		case 'assign': {
			patch.assignedTo = typeof body.to === 'string' ? body.to.trim().slice(0, 60) : '';
			break;
		}
	}

	const now = Date.now();
	const previousStatus = normalizeStatus(lead.status);
	const result = applyLeadPatch(lead, patch, now);
	if (!result.changed.length) return crmJson({ ok: true, lead, unchanged: true });

	lead.updatedAt = now;
	await saveLead(lead);
	for (const event of result.events) {
		await pushEvent(lead.id, { ts: now, type: event.type, detail: event.detail, actor: 'hermes' });
	}

	// A first reply closes the follow-up queue, whoever sent it.
	let closedTasks = 0;
	if (lead.firstResponseAt) {
		const tasks = (await listTasks()).filter((task) => task.leadId === lead.id && task.state === 'open');
		for (const task of tasks) {
			task.state = 'done';
			task.completedAt = now;
			closedTasks += 1;
			await saveTask(task);
		}
		if (closedTasks) {
			await pushEvent(lead.id, {
				ts: now,
				type: 'task',
				detail: `Closed ${closedTasks} follow-up task(s) after the first reply`,
				actor: 'hermes',
			});
		}
	}

	if (result.changed.includes('status')) {
		await emitJev('lead.status_changed', leadData(lead, { previousStatus, by: 'hermes' }), now);
	} else if (result.changed.includes('firstResponseAt')) {
		await emitJev('lead.responded', leadData(lead, { by: 'hermes' }), now);
	}

	log('info', 'crm_agent_action', {
		leadId: lead.id,
		actor: 'hermes',
		action,
		changed: result.changed.join(','),
		closedTasks,
	});

	return crmJson({ ok: true, lead, actor: 'hermes' });
};
