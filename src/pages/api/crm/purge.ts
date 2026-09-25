/**
 * POST /api/crm/purge/ — wipe all CRM data (leads, events, tasks, metrics).
 *
 * Protected by HERMES_TOKEN. This is a destructive operation meant for
 * development and testing resets only. Requires:
 *   x-hermes-token: $HERMES_TOKEN
 *   Body: { "confirm": "PURGE_ALL" }
 *
 * Returns the count of deleted keys.
 */
import type { APIRoute } from 'astro';
import { requireHermes } from '../../../lib/crm/guard';
import { crmJson, log } from '../../../lib/crm/http';
import { allLeads, listTasks } from '../../../lib/crm/store';

export const prerender = false;

// Inline Redis helper (same pattern as store.ts)
async function redis(cmds: [string, ...unknown[]][]): Promise<unknown[] | null> {
	const url = import.meta.env.UPSTASH_REDIS_REST_URL;
	const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN;
	if (!url || !token) return null;
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(cmds.length === 1 ? cmds[0] : cmds),
		});
		if (!res.ok) return null;
		const data = await res.json();
		return Array.isArray(data) ? data : [data];
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

		// Collect all keys to delete
		const keysToDelete: string[] = [];

		// Lead keys and index keys
		for (const lead of leads) {
			keysToDelete.push(`crm:lead:${lead.id}`);
			keysToDelete.push(`crm:idx:email:${lead.email.toLowerCase().trim()}`);
			keysToDelete.push(`crm:events:${lead.id}`);
		}

		// Task keys
		for (const task of tasks) {
			keysToDelete.push(`crm:task:${task.id}`);
		}

		// Index and queue keys
		keysToDelete.push('crm:idx:time');
		keysToDelete.push('crm:tasks');

		// Daily metrics (last 60 days)
		const now = new Date();
		for (let i = 0; i < 60; i++) {
			const d = new Date(now);
			d.setDate(d.getDate() - i);
			keysToDelete.push(`crm:metrics:${d.toISOString().slice(0, 10)}`);
		}

		// Ledger keys
		for (let i = 0; i < 30; i++) {
			const d = new Date(now);
			d.setDate(d.getDate() - i);
			keysToDelete.push(`crm:ledger:${d.toISOString().slice(0, 10)}`);
		}

		// Delete in batches of 50
		let deleted = 0;
		for (let i = 0; i < keysToDelete.length; i += 50) {
			const batch = keysToDelete.slice(i, i + 50);
			const result = await redis(batch.map((k) => ['DEL', k]));
			if (result) {
				deleted += result.reduce((sum: number, r: unknown) => sum + (typeof r === 'number' ? r : 0), 0);
			}
		}

		log('info', 'crm_purge', { leads: leads.length, tasks: tasks.length, keysDeleted: deleted });

		return crmJson({ ok: true, deleted, leadsCleared: leads.length, tasksCleared: tasks.length });
	} catch (error) {
		log('error', 'crm_purge_failed', { reason: error instanceof Error ? error.message : 'unknown' });
		return crmJson({ ok: false, error: 'purge_failed' }, 500);
	}
};