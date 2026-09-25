/**
 * POST /api/crm/purge/ — wipe all CRM data (leads, events, tasks, metrics).
 *
 * Protected by HERMES_TOKEN. This is a destructive operation meant for
 * development and testing resets only. Requires:
 *   x-hermes-token: $HERMES_TOKEN
 *   Body: { "confirm": "PURGE_ALL" }
 */
import type { APIRoute } from 'astro';
import { requireHermes } from '../../../lib/crm/guard';
import { crmJson, log } from '../../../lib/crm/http';
import { allLeads, listTasks } from '../../../lib/crm/store';

export const prerender = false;

async function redisPipeline(cmds: [string, ...unknown[]][]): Promise<unknown[] | null> {
	const url = import.meta.env.UPSTASH_REDIS_REST_URL;
	const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN;
	if (!url || !token) return null;
	try {
		const response = await fetch(`${String(url).replace(/\/$/, '')}/pipeline`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(cmds),
			cache: 'no-store',
		});
		if (!response.ok) return null;
		const rows = (await response.json()) as Array<{ result?: unknown; error?: string }>;
		return rows.map((row) => row?.result ?? null);
	} catch {
		return null;
	}
}

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
		return crmJson({ ok: false, error: 'confirmation_required', hint: 'Send { "confirm": "PURGE_ALL" }' }, 422);
	}

	try {
		const leads = await allLeads();
		const tasks = await listTasks();

		const cmds: [string, ...unknown[]][] = [];

		// Delete each lead and its indexes
		for (const lead of leads) {
			cmds.push(['DEL', `crm:lead:${lead.id}`]);
			cmds.push(['DEL', `crm:idx:email:${lead.email.toLowerCase().trim()}`]);
			cmds.push(['DEL', `crm:events:${lead.id}`]);
		}

		// Delete tasks
		for (const task of tasks) {
			cmds.push(['DEL', `crm:task:${task.id}`]);
		}

		// Delete index sorted sets
		cmds.push(['DEL', 'crm:idx:time']);
		cmds.push(['DEL', 'crm:idx:tasks']);

		// Delete daily metrics and ledger (last 60 days)
		const now = new Date();
		for (let i = 0; i < 60; i++) {
			const d = new Date(now);
			d.setDate(d.getDate() - i);
			const day = d.toISOString().slice(0, 10);
			cmds.push(['DEL', `crm:metrics:${day}`]);
			cmds.push(['DEL', `crm:ledger:${day}`]);
		}

		// Delete report cache
		cmds.push(['DEL', 'crm:report:last']);

		// Execute in batches of 50
		let totalDeleted = 0;
		for (let i = 0; i < cmds.length; i += 50) {
			const batch = cmds.slice(i, i + 50);
			const result = await redisPipeline(batch);
			if (result) {
				totalDeleted += result.reduce((sum: number, r: unknown) => sum + (typeof r === 'number' ? r : 0), 0);
			}
		}

		log('info', 'crm_purge', { leads: leads.length, tasks: tasks.length, cmdsSent: cmds.length, deleted: totalDeleted });

		return crmJson({ ok: true, leadsCleared: leads.length, tasksCleared: tasks.length, cmdsSent: cmds.length });
	} catch (error) {
		log('error', 'crm_purge_failed', { reason: error instanceof Error ? error.message : 'unknown' });
		return crmJson({ ok: false, error: 'purge_failed' }, 500);
	}
};