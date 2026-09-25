/**
 * GET /api/crm/leads/:id/ — one lead with its timeline and follow-up tasks.
 * PATCH /api/crm/leads/:id/ — move it through the pipeline or annotate it.
 *
 * PATCH body: { status?, note?, assignedTo?, responded? }
 *
 * Moving a lead out of `novo` or flagging `responded` stamps the first
 * response time (used by the response-time KPI), closes that lead's open
 * follow-up tasks and notifies JEV.
 */
import type { APIRoute } from 'astro';
import { emitJev, leadData } from '../../../../lib/crm/automation';
import { requireCrm } from '../../../../lib/crm/guard';
import { crmJson, leadRef, log } from '../../../../lib/crm/http';
import { isLeadStatus, type LeadStatus } from '../../../../lib/crm/schema';
import { listEvents, listTasks, getLead, pushEvent, saveLead, saveTask } from '../../../../lib/crm/store';

export const prerender = false;

const NOTE_LIMIT = 600;
const ASSIGNEE_LIMIT = 60;

export const ALL: APIRoute = async ({ request, params }) => {
	const denied = requireCrm(request);
	if (denied) return denied;

	const id = String(params.id ?? '');
	if (!id) return crmJson({ ok: false, error: 'missing_id' }, 400);

	const lead = await getLead(id);
	if (!lead) return crmJson({ ok: false, error: 'not_found' }, 404);

	if (request.method === 'GET') {
		const [events, tasks] = await Promise.all([listEvents(id), listTasks()]);
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

	const now = Date.now();
	const previousStatus: LeadStatus = lead.status;
	const changed: string[] = [];
	const events: Array<{ type: 'status' | 'note' | 'response'; detail: string }> = [];

	/* Status ------------------------------------------------------------- */
	if (body.status !== undefined) {
		if (!isLeadStatus(body.status)) return crmJson({ ok: false, error: 'invalid_status' }, 422);
		if (body.status !== lead.status) {
			lead.status = body.status;
			changed.push('status');
			events.push({
				type: 'status',
				detail: `Moved from ${previousStatus} to ${lead.status}`,
			});
			// Any deliberate move means the studio has engaged with the lead.
			if (!lead.firstResponseAt && lead.status !== 'novo') lead.firstResponseAt = now;
		}
	}

	/* Assignee ------------------------------------------------------------ */
	if (body.assignedTo !== undefined) {
		const value = typeof body.assignedTo === 'string' ? body.assignedTo.trim().slice(0, ASSIGNEE_LIMIT) : '';
		if (value !== lead.assignedTo) {
			lead.assignedTo = value;
			changed.push('assignedTo');
			events.push({ type: 'status', detail: value ? `Assigned to ${value}` : 'Assignment cleared' });
		}
	}

	/* Note ---------------------------------------------------------------- */
	if (body.note !== undefined) {
		const text = typeof body.note === 'string' ? body.note.trim().slice(0, NOTE_LIMIT) : '';
		if (!text) return crmJson({ ok: false, error: 'empty_note' }, 422);
		lead.notes.push({ ts: now, author: 'studio', text });
		changed.push('notes');
		events.push({ type: 'note', detail: text.slice(0, 120) });
	}

	/* Explicit "answered" flag ------------------------------------------- */
	if (body.responded === true && !lead.firstResponseAt) {
		lead.firstResponseAt = now;
		changed.push('firstResponseAt');
		events.push({ type: 'response', detail: 'Marked as answered' });
	}

	if (!changed.length) return crmJson({ ok: true, lead, unchanged: true });

	lead.updatedAt = now;
	await saveLead(lead);
	for (const event of events) {
		await pushEvent(lead.id, { ts: now, type: event.type, detail: event.detail, actor: 'studio' });
	}

	/* Follow-up tasks ----------------------------------------------------- */
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
				actor: 'studio',
			});
		}
	}

	/* JEV ----------------------------------------------------------------- */
	if (changed.includes('status')) {
		await emitJev('lead.status_changed', leadData(lead, { previousStatus }), now);
	} else if (changed.includes('firstResponseAt')) {
		await emitJev('lead.responded', leadData(lead), now);
	}

	log('info', 'crm_lead_updated', { ...leadRef(lead), changed: changed.join(','), closedTasks });

	return crmJson({ ok: true, lead });
};
