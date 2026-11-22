/**
 * Lead mutations shared by two callers with different credentials:
 *
 *   · the dashboard PATCH `/api/crm/leads/:id/` → actor `studio`
 *   · Hermes             POST `/api/crm/agent/` → actor `hermes`
 *
 * One code path means an agent move is validated exactly like a human move,
 * and every change lands in the timeline with the actor that made it — the
 * audit trail is the point of the hybrid orchestration.
 *
 * There is deliberately no delete and no way to erase a note: the pipeline
 * records what happened, not what someone wishes had happened.
 */
import { normalizeStatus, type CrmLead, type LeadEventType, type LeadStatus } from './schema';
import { ORIGIN_OPTIONS, RECOMMENDED_SERVICES, validNextStepDate } from '../lead-intake';


const NOTE_LIMIT = 600;
const ASSIGNEE_LIMIT = 60;
export const NEXT_STEP_LIMIT = 240;

const INTAKE_FIELDS = ['origin', 'recommendedService', 'nextStep', 'nextStepDate'] as const;
type EditableIntakeField = (typeof INTAKE_FIELDS)[number];

/** Validate a studio edit before any mutation or persistence. */
export function invalidIntakeField(body: Record<string, unknown>): EditableIntakeField | undefined {
	for (const key of INTAKE_FIELDS) {
		const value = body[key];
		if (value === undefined) continue;
		if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) return key;
		if (key === 'origin' && value !== '' && !(ORIGIN_OPTIONS as readonly string[]).includes(value)) return key;
		if (key === 'recommendedService' && value !== '' && !(RECOMMENDED_SERVICES as readonly string[]).includes(value)) return key;
		if (key === 'nextStep' && value.trim().length > NEXT_STEP_LIMIT) return key;
		if (key === 'nextStepDate' && !validNextStepDate(value)) return key;
	}
	return undefined;
}

export interface LeadChange {
	type: LeadEventType;
	/** Short, already-formatted detail for the timeline. */
	detail: string;
}

export interface ApplyResult {
	/** Empty when nothing valid changed. */
	changed: string[];
	events: LeadChange[];
	/** True when the first-response clock started. */
	responded: boolean;
	previousStatus: LeadStatus;
}

/**
 * Applies a validated partial update to a lead in place. The caller persists
 * the document and the events; this function never touches storage, so the
 * human and agent endpoints cannot diverge in behaviour.
 */
export function applyLeadPatch(lead: CrmLead, body: Record<string, unknown>, now: number): ApplyResult {
	const result: ApplyResult = { changed: [], events: [], responded: false, previousStatus: normalizeStatus(lead.status) };

	/* Status ------------------------------------------------------------- */
	if (body.status !== undefined) {
		const next = normalizeStatus(body.status);
		if (next !== lead.status) {
			lead.status = next;
			result.changed.push('status');
			result.events.push({ type: 'status', detail: `Moved from ${result.previousStatus} to ${next}` });
			// A pipeline move is not evidence that a reply was sent.
			// Only the explicit responded action starts the response clock.
		}
	}

	/* Assignee ------------------------------------------------------------ */
	if (body.assignedTo !== undefined) {
		const value =
			typeof body.assignedTo === 'string' ? body.assignedTo.trim().slice(0, ASSIGNEE_LIMIT) : '';
		if (value !== lead.assignedTo) {
			lead.assignedTo = value;
			result.changed.push('assignedTo');
			result.events.push({ type: 'status', detail: value ? `Assigned to ${value}` : 'Assignment cleared' });
		}
	}

	/* Note ---------------------------------------------------------------- */
	if (body.note !== undefined) {
		const text = typeof body.note === 'string' ? body.note.trim().slice(0, NOTE_LIMIT) : '';
		if (text) {
			lead.notes.push({ ts: now, author: 'studio', text });
			result.changed.push('notes');
			result.events.push({ type: 'note', detail: text.slice(0, 120) });
		}
	}

	/* Studio-only intake and follow-up fields. Do not put free text in the audit event. */
	if (!invalidIntakeField(body)) {
		const changes = INTAKE_FIELDS.filter((key) =>
			typeof body[key] === 'string' && (body[key] as string).trim() !== (lead[key] ?? ''),
		);
		for (const key of changes) {
			Object.assign(lead, { [key]: (body[key] as string).trim() });
			result.changed.push(key);
		}
		if (changes.length) result.events.push({ type: 'intake', detail: 'Updated lead source, service or follow-up details' });
	}

	/* Explicit "answered" flag ------------------------------------------- */
	if (body.responded === true && !lead.firstResponseAt) {
		lead.firstResponseAt = now;
		result.changed.push('firstResponseAt');
		result.responded = true;
		result.events.push({ type: 'response', detail: 'Marked as answered' });
	}

	return result;
}

