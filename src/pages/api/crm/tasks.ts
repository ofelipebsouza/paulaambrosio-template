/**
 * GET  /api/crm/tasks/ — the follow-up queue, oldest deadline first.
 * PATCH /api/crm/tasks/ — { id, state: 'open' | 'done' | 'snoozed' }.
 *
 * Completing a task does not claim a reply was sent. Use the lead's explicit
 * Mark as answered action to record first response and close its reminders.
 */
import type { APIRoute } from 'astro';
import { requireCrm } from '../../../lib/crm/guard';
import { crmJson, log } from '../../../lib/crm/http';
import type { TaskState } from '../../../lib/crm/schema';
import { CrmReadUnavailableError, CrmWriteUnconfirmedError, listTasks, saveTask, storeStatus } from '../../../lib/crm/store';

export const prerender = false;

const STATES: TaskState[] = ['open', 'done', 'snoozed'];

const handle: APIRoute = async ({ request }) => {
	const denied = requireCrm(request);
	if (denied) return denied;

	const now = Date.now();

	if (request.method === 'GET') {
		const tasks = await listTasks({ requireAvailable: true });
		return crmJson({
			ok: true,
			tasks,
			overdue: tasks.filter((task) => task.state === 'open' && task.dueAt <= now).length,
			storage: storeStatus(),
		});
	}

	if (request.method !== 'PATCH') return crmJson({ ok: false, error: 'method_not_allowed' }, 405);

	let body: { id?: unknown; state?: unknown };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return crmJson({ ok: false, error: 'invalid_body' }, 400);
	}

	const id = typeof body.id === 'string' ? body.id : '';
	const state = typeof body.state === 'string' ? (body.state as TaskState) : null;
	if (!id || !state || !STATES.includes(state)) return crmJson({ ok: false, error: 'invalid_task' }, 422);

	const tasks = await listTasks({ requireAvailable: true });
	const storedTask = tasks.find((entry) => entry.id === id);
	if (!storedTask) return crmJson({ ok: false, error: 'not_found' }, 404);

	const task = structuredClone(storedTask);
	task.state = state;
	task.completedAt = state === 'done' ? now : null;
	try {
		await saveTask(task, { requireDurable: true });
	} catch (error) {
		if (!(error instanceof CrmWriteUnconfirmedError)) throw error;
		return crmJson({ ok: false, error: 'write_unconfirmed', reconcileBeforeRetry: true }, 503);
	}

	log('info', 'crm_task_updated', { state, closedBy: 'studio' });
	return crmJson({ ok: true, task, lead: null });
};


export const ALL: APIRoute = async (context) => {
	try {
		return await handle(context);
	} catch (error) {
		if (!(error instanceof CrmReadUnavailableError)) throw error;
		return crmJson({ ok: false, error: 'read_unavailable' }, 503);
	}
};
