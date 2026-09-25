/**
 * CRM domain model.
 *
 * A lead is born in `src/pages/api/contact.ts` from the same `ContactPayload`
 * the email templates consume, so the website form, the studio email and the
 * internal CRM can never drift apart on field names or option lists.
 *
 * Plain data only: no Node APIs, no fetches — safe to import from pages, API
 * routes and the client script of the dashboard alike.
 */
import { CONTACT_FORM_IDS } from '../contact-form';
import type { ContactPayload } from '../contact-email';

/* -------------------------------------------------------------------------- */
/* Pipeline                                                                   */
/* -------------------------------------------------------------------------- */

export const LEAD_STATUSES = ['novo', 'em_contato', 'proposta', 'fechado', 'perdido'] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Human wording used by the dashboard (the site copy is English). */
export const STATUS_LABELS: Record<LeadStatus, string> = {
	novo: 'New',
	em_contato: 'In contact',
	proposta: 'Proposal sent',
	fechado: 'Won',
	perdido: 'Lost',
};

/** Statuses still requiring a reply — drives the "awaiting answer" counter. */
export const OPEN_STATUSES: readonly LeadStatus[] = ['novo', 'em_contato', 'proposta'];

export function isLeadStatus(value: unknown): value is LeadStatus {
	return typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/* Records                                                                    */
/* -------------------------------------------------------------------------- */

/** How the studio's copy of the inquiry fared after the CRM stored it. */
export type LeadDelivery = 'pending' | 'sent' | 'failed' | 'unavailable';

export interface CrmNote {
	/** Epoch milliseconds. */
	ts: number;
	author: string;
	text: string;
}

export interface CrmLead {
	id: string;
	/** Epoch milliseconds everywhere — the dashboard formats for display. */
	createdAt: number;
	updatedAt: number;
	/** First time the studio replied or moved the lead out of `novo`. */
	firstResponseAt: number | null;

	name: string;
	email: string;
	phone: string;
	location: string;
	propertyType: string;
	service: string;
	budget: string;
	timeline: string;
	message: string;

	/** Which form produced it: `contact` page or `project_inquiry` modal. */
	form: string;
	/** Path the visitor submitted from, e.g. `/turnkey-interior-design-miami/`. */
	page: string;

	status: LeadStatus;
	assignedTo: string;
	delivery: LeadDelivery;
	notes: CrmNote[];
}

export type LeadEventType = 'created' | 'status' | 'note' | 'response' | 'task' | 'delivery';

export interface CrmEvent {
	ts: number;
	type: LeadEventType;
	/** Short, already-formatted detail. Never raw PII beyond a display name. */
	detail: string;
	actor: string;
}

/* -------------------------------------------------------------------------- */
/* Follow-up tasks (JEV automation)                                           */
/* -------------------------------------------------------------------------- */

export type TaskState = 'open' | 'done' | 'snoozed';

export interface CrmTask {
	id: string;
	leadId: string;
	/** Snapshot so the queue renders without loading every lead. */
	leadName: string;
	leadEmail: string;
	title: string;
	/** Epoch ms — the moment the task becomes overdue. */
	dueAt: number;
	state: TaskState;
	createdAt: number;
	completedAt: number | null;
	/** Set when the reminder cron already notified the team about this task. */
	remindedAt: number | null;
}

/* -------------------------------------------------------------------------- */
/* Hermes report                                                              */
/* -------------------------------------------------------------------------- */

export interface HermesReport {
	/** Epoch ms when Hermes generated it. */
	generatedAt: number;
	summary: string;
	highlights: string[];
	actions: string[];
	/** Optional KPI snapshot Hermes computed; the dashboard falls back to its own. */
	kpis?: Record<string, number>;
}

/* -------------------------------------------------------------------------- */
/* Construction                                                               */
/* -------------------------------------------------------------------------- */

export interface LeadSource {
	payload: ContactPayload;
	/** Form identifier posted by the browser (`contact` / `project_inquiry`). */
	form: string;
	page: string;
	id: string;
	now: number;
}

export function newId(): string {
	// Collision-safe enough for a studio inbox, short enough to read in a URL.
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function buildLead({ payload, form, page, id, now }: LeadSource): CrmLead {
	return {
		id,
		createdAt: now,
		updatedAt: now,
		firstResponseAt: null,
		name: payload.name,
		email: payload.email,
		phone: payload.phone,
		location: payload.location,
		propertyType: payload.propertyType,
		service: payload.service,
		budget: payload.budget,
		timeline: payload.timeline,
		message: payload.message,
		form: form || CONTACT_FORM_IDS.contact,
		page: page || '/',
		status: 'novo',
		assignedTo: '',
		delivery: 'pending',
		notes: [],
	};
}

/* -------------------------------------------------------------------------- */
/* Display helpers                                                            */
/* -------------------------------------------------------------------------- */

/**
 * `j***@domain.tld` — the form keeps logging rules (no full address in a log
 * line, a cron subject or a webhook payload) wherever an address is optional.
 */
export function maskEmail(email: string): string {
	const at = email.indexOf('@');
	if (at <= 0) return '***';
	const local = email.slice(0, at);
	const domain = email.slice(at + 1);
	return `${local.slice(0, 1)}${'*'.repeat(Math.max(2, Math.min(6, local.length - 1)))}@${domain}`;
}

/** `2026-09-13` in UTC — the key used by the daily counter buckets. */
export function dayKey(ms: number): string {
	return new Date(ms).toISOString().slice(0, 10);
}

/** Human label for a status filter chip. */
export function statusLabel(status: LeadStatus): string {
	return STATUS_LABELS[status];
}
