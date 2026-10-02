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

/**
 * The hybrid funnel: every lead enters as `novo`, an agent (Hermes) or the
 * studio picks it up, a meeting is scheduled and held before the proposal,
 * and the two closed states live outside the board as Won / Lost tabs.
 */
export const LEAD_STATUSES = [
	'novo',
	'atendimento_ia',
	'atendimento_humano',
	'reuniao_agendada',
	'reuniao_realizada',
	'proposta',
	'fechado',
	'perdido',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/**
 * Pre-Kanban records used `em_contato`. The value is still accepted wherever
 * a status comes in from storage or an API client, and is stored back as
 * `atendimento_humano`, so old data keeps counting without a migration.
 */
export const LEGACY_STATUS_ALIAS: Record<string, LeadStatus> = {
	em_contato: 'atendimento_humano',
};

/** Human wording used by the dashboard (the site copy is English). */
export const STATUS_LABELS: Record<LeadStatus, string> = {
	novo: 'New',
	atendimento_ia: 'AI handling',
	atendimento_humano: 'Human handling',
	reuniao_agendada: 'Meeting scheduled',
	reuniao_realizada: 'Meeting held',
	proposta: 'Proposal sent',
	fechado: 'Won',
	perdido: 'Lost',
};

/** Statuses still requiring a reply — drives the "awaiting answer" counter. */
export const OPEN_STATUSES: readonly LeadStatus[] = [
	'novo',
	'atendimento_ia',
	'atendimento_humano',
	'reuniao_agendada',
	'reuniao_realizada',
	'proposta',
];

/** The statuses rendered as columns on the board (Won/Lost are tabs). */
export const BOARD_STATUSES: readonly LeadStatus[] = [
	'novo',
	'atendimento_ia',
	'atendimento_humano',
	'reuniao_agendada',
	'reuniao_realizada',
	'proposta',
];

/** Closed states shown outside the board. */
export const CLOSED_STATUSES: readonly LeadStatus[] = ['fechado', 'perdido'];

/** True when the value names a status of the current funnel (alias included). */
export function isLeadStatus(value: unknown): value is LeadStatus {
	return (
		typeof value === 'string' &&
		((LEAD_STATUSES as readonly string[]).includes(value) || Boolean(LEGACY_STATUS_ALIAS[value]))
	);
}

/** Maps a stored or supplied status onto the current funnel. */
export function normalizeStatus(value: unknown): LeadStatus {
	if (typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value)) return value as LeadStatus;
	if (typeof value === 'string' && LEGACY_STATUS_ALIAS[value]) return LEGACY_STATUS_ALIAS[value];
	return 'novo';
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

/**
 * Geolocation resolved server-side from the `x-vercel-ip-*` headers the
 * platform injects. Absent in local development; never a remote lookup.
 */
export interface LeadGeo {
	/** ISO country code, e.g. `US`. */
	city?: string;
	country?: string;
	/** City name (decoded from Vercel's base64 header). */
	region?: string;
	lat?: string;
	lng?: string;
	/** IANA timezone, e.g. `America/New_York`. */
	tz?: string;
}

/** Campaign attribution — read from the form's hidden UTM fields only. */
export interface LeadUtm {
	source?: string;
	medium?: string;
	campaign?: string;
	content?: string;
	term?: string;
}

/** Heuristics that mark a lead for review without ever discarding it. */
export type LeadFlag = 'disposable_email' | 'repeat_submitter' | 'missing_ua' | 'automation_ua' | 'jev_spam';

/* -------------------------------------------------------------------------- */
/* JEV scoring                                                                */
/* -------------------------------------------------------------------------- */

/** How hot JEV thinks the inquiry is, in the studio's own pipeline wording. */
export type JevTemperature = 'hot' | 'warm' | 'cold' | 'spam';

export type JevProjectType = 'residential' | 'hospitality' | 'commercial' | 'vendor_press' | 'other';

export type JevBudgetFit = 'high' | 'medium' | 'low' | 'unknown';

export type JevSentiment = 'positive' | 'neutral' | 'negative';

/**
 * The scoring snapshot stored on the lead. Everything is already normalised to
 * the shapes the dashboard renders (scores in 0…1), so no caller ever has to
 * know how JEV answers a `score` question.
 *
 * Optional on `CrmLead`: records written before scoring existed simply do not
 * carry it, and the dashboard shows them as unclassified.
 */
export interface LeadJev {
	/** 0…1 probability that this is a real, funded interior design project. */
	score: number;
	temperature: JevTemperature;
	projectType: JevProjectType;
	budgetFit: JevBudgetFit;
	/** 0…1 — 0 browsing, 1 has a date to hit. */
	urgency: number;
	sentiment: JevSentiment;
	/** Model the answer came from, e.g. `jev-1.13.0`. */
	model: string;
	/** Round trip in milliseconds, for the panel's "still live?" note. */
	latencyMs: number;
	/** Epoch ms when the score was taken. */
	at: number;
}

const JEV_TEMPERATURES: readonly JevTemperature[] = ['hot', 'warm', 'cold', 'spam'];
const JEV_PROJECT_TYPES: readonly JevProjectType[] = ['residential', 'hospitality', 'commercial', 'vendor_press', 'other'];
const JEV_BUDGET_FITS: readonly JevBudgetFit[] = ['high', 'medium', 'low', 'unknown'];
const JEV_SENTIMENTS: readonly JevSentiment[] = ['positive', 'neutral', 'negative'];

export function isJevTemperature(value: unknown): value is JevTemperature {
	return typeof value === 'string' && (JEV_TEMPERATURES as readonly string[]).includes(value);
}

/** Temperature JEV omitted or mislabelled: fall back to the score itself. */
export function temperatureFromScore(score: number): JevTemperature {
	if (score >= 0.7) return 'hot';
	if (score >= 0.4) return 'warm';
	return 'cold';
}

/** Narrows an unknown JEV answer to a known union member. */
export function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
	return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** JEV answers arrive as unknown JSON: these three never throw. */
export function jevProjectType(value: unknown): JevProjectType {
	return oneOf(value, JEV_PROJECT_TYPES, 'other');
}

export function jevBudgetFit(value: unknown): JevBudgetFit {
	return oneOf(value, JEV_BUDGET_FITS, 'unknown');
}

export function jevSentiment(value: unknown): JevSentiment {
	return oneOf(value, JEV_SENTIMENTS, 'neutral');
}

export function jevTemperature(value: unknown): JevTemperature {
	return oneOf(value, JEV_TEMPERATURES, 'warm');
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

	/* Enrichment — captured server-side, shown only inside the CRM. */
	/** Client IP (first `x-forwarded-for` hop). Never logged raw, never webhocked. */
	ip: string;
	/** Platform geolocation from the `x-vercel-ip-*` headers; empty in dev. */
	geo: LeadGeo;
	/** User-Agent, truncated. Parsed device hints are display-only. */
	userAgent: string;
	/** Full referrer URL, truncated. */
	referrer: string;
	/** Landing path recorded with the UTM parameters. */
	landing: string;
	utm: LeadUtm;
	/** Review markers: stored and displayed, never a reason to drop the lead. */
	flags: LeadFlag[];

	/**
	 * JEV scoring snapshot. Absent on records written before scoring existed
	 * and on leads classified while JEV was unreachable — the dashboard counts
	 * both as "not scored" rather than treating them as cold.
	 */
	jev?: LeadJev | null;

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

/** Request-derived context the contact endpoint attaches to a new lead. */
export interface LeadContext {
	ip: string;
	geo: LeadGeo;
	userAgent: string;
	referrer: string;
	landing: string;
	utm: LeadUtm;
	flags: LeadFlag[];
}

export interface LeadSource {
	payload: ContactPayload;
	/** Form identifier posted by the browser (`contact` / `project_inquiry`). */
	form: string;
	page: string;
	id: string;
	now: number;
	/** Enrichment captured from the request; omitted only in tests. */
	context?: Partial<LeadContext>;
}

export function newId(): string {
	// Collision-safe enough for a studio inbox, short enough to read in a URL.
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function buildLead({ payload, form, page, id, now, context }: LeadSource): CrmLead {
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
		ip: context?.ip ?? '',
		geo: context?.geo ?? {},
		userAgent: context?.userAgent ?? '',
		referrer: context?.referrer ?? '',
		landing: context?.landing ?? '',
		utm: context?.utm ?? {},
		flags: context?.flags ?? [],
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

/**
 * `203.0.113.9` → `203.0.113.x` — what logs, webhooks and exports may carry.
 * The full address stays in the lead document, behind the dashboard session.
 */
export function maskIp(ip: string): string {
	if (!ip) return '';
	if (ip.includes(':')) {
		const groups = ip.split(':');
		return `${groups.slice(0, 2).join(':')}:…`;
	}
	return ip.replace(/\.\d+$/, '.x');
}

/** `2026-09-13` in UTC — the key used by the daily counter buckets. */
export function dayKey(ms: number): string {
	return new Date(ms).toISOString().slice(0, 10);
}

/** Human label for a status filter chip. */
export function statusLabel(status: LeadStatus): string {
	return STATUS_LABELS[status];
}
