/**
 * GET /api/crm/leads/:id/ — one lead with its timeline and follow-up tasks.
 * PATCH /api/crm/leads/:id/ — move it through the pipeline or annotate it.
 *
 * PATCH body: { status?, note?, assignedTo?, responded? }
 *
 * The mutation itself lives in `src/lib/crm/lead-actions.ts`, shared with the
 * Hermes agent endpoint, so a move made here and a move made by the agent are
 * validated identically and recorded with their actor.
 */
import type { APIRoute } from 'astro';
import { emitJev, leadData } from '../../../../lib/crm/automation';
import { requireCrm } from '../../../../lib/crm/guard';
import { crmJson, leadRef, log } from '../../../../lib/crm/http';
import { applyLeadPatch } from '../../../../lib/crm/lead-actions';
import { completeReplyTasks } from '../../../../lib/crm/task-actions';
import { isLeadStatus } from '../../../../lib/crm/schema';
import { CrmReadUnavailableError, CrmWriteUnconfirmedError, listEvents, listTasks, getLead, pushEvent, saveLead, saveTask } from '../../../../lib/crm/store';

export const prerender = false;

const handle: APIRoute = async ({ request, params }) => {
	const denied = requireCrm(request);
	if (denied) return denied;

	const id = String(params.id ?? '');
	if (!id) return crmJson({ ok: false, error: 'missing_id' }, 400);

	const storedLead = await getLead(id, { requireAvailable: true });
	if (!storedLead) return crmJson({ ok: false, error: 'not_found' }, 404);

	// Do not mutate the fallback store by reference if persistence later fails.
	const lead = structuredClone(storedLead);
	if (request.method === 'GET') {
		const [events, tasks] = await Promise.all([listEvents(id), listTasks({ requireAvailable: true })]);
		return crmJson({
			ok: true,
			lead,
			events,
			tasks: tasks.filter((task) => task.leadId === id),
		});
	}

	if (request.method !== 'PATCH') return crmJson({ ok: false, error: 'method_not_allowed' }, 405);

	let body: Record<string, unknown>;
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		return crmJson({ ok: false, error: 'invalid_body' }, 400);
	}

	// Reject malformed input before touching the document: the caller gets an
	// explicit 422 instead of a silent normalisation to `novo`.
	if (body.status !== undefined && !isLeadStatus(body.status)) {
		return crmJson({ ok: false, error: 'invalid_status' }, 422);
	}
	if (body.note !== undefined && !String(body.note ?? '').trim()) {
		return crmJson({ ok: false, error: 'empty_note' }, 422);
	}

	const now = Date.now();
	const result = applyLeadPatch(lead, body, now);
	if (!result.changed.length) return crmJson({ ok: true, lead, unchanged: true });

	// Establish the reminder set before persisting firstResponseAt.
	const tasksToClose = result.responded
		? completeReplyTasks(await listTasks({ requireAvailable: true }), lead.id, now)
		: [];
	let closedTasks = 0;
	try {
		lead.updatedAt = now;
		await saveLead(lead, { requireDurable: true });
		for (const event of result.events) {
			await pushEvent(lead.id, { ts: now, type: event.type, detail: event.detail, actor: 'studio' }, { requireDurable: true });
		}

		/* Follow-up tasks ----------------------------------------------------- */
		if (result.responded) {
			for (const task of tasksToClose) {
				closedTasks += 1;
				await saveTask(task, { requireDurable: true });
			}
			if (closedTasks) {
				await pushEvent(lead.id, {
					ts: now,
					type: 'task',
					detail: `Closed ${closedTasks} follow-up task(s) after the first reply`,
					actor: 'studio',
				}, { requireDurable: true });
			}
		}
	} catch (error) {
		if (!(error instanceof CrmWriteUnconfirmedError)) throw error;
		return crmJson({ ok: false, error: 'write_unconfirmed', reconcileBeforeRetry: true }, 503);
	}

	/* JEV ----------------------------------------------------------------- */
	if (result.changed.includes('status')) {
		await emitJev('lead.status_changed', leadData(lead, { previousStatus: result.previousStatus }), now);
	}
	if (result.responded) {
		await emitJev('lead.responded', leadData(lead), now);
	}

	log('info', 'crm_lead_updated', {
		...leadRef(lead),
		actor: 'studio',
		changed: result.changed.join(','),
		closedTasks,
	});

	return crmJson({ ok: true, lead });
};


export const ALL: APIRoute = async (context) => {
	try {
		return await handle(context);
	} catch (error) {
		if (!(error instanceof CrmReadUnavailableError)) throw error;
		return crmJson({ ok: false, error: 'read_unavailable' }, 503);
	}
};
