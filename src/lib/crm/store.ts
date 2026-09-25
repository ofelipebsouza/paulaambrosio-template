/**
 * CRM persistence.
 *
 * Storage is Upstash Redis over REST — the same backend the contact endpoint
 * already uses for distributed rate limiting, so no new dependency and no
 * server to run. Commands go through one `/pipeline` call; every operation
 * degrades to an in-process store when the credentials are missing or the
 * backend errors, exactly like `src/lib/rate-limit.ts`, and reports which
 * backend answered so the dashboard never claims durability it does not have.
 *
 * Keys (all prefixed `crm:`):
 *   crm:lead:{id}         JSON document
 *   crm:idx:time          ZSET  score = createdAt  member = id
 *   crm:idx:email:{hmac}  STRING id (lookup without storing a raw address)
 *   crm:events:{id}       ZSET  score = ts  member = JSON event
 *   crm:metrics:{day}     HASH  counters (leads, by service, …)
 *   crm:task:{id}         JSON document
 *   crm:idx:tasks         ZSET  score = dueAt  member = id
 *   crm:report:last       JSON document
 */
import { createHash } from 'node:crypto';
import {
	dayKey,
	type CrmEvent,
	type CrmLead,
	type CrmTask,
	type HermesReport,
	type LeadStatus,
} from './schema';

type Cmd = (string | number)[];

interface StoreStatus {
	backend: 'upstash' | 'memory';
	/** True when Redis was expected (credentials present) but did not answer. */
	degraded: boolean;
	lastError: string | null;
}

const status: StoreStatus = { backend: 'memory', degraded: false, lastError: null };

export function storeStatus(): StoreStatus {
	return { ...status };
}

let warned = false;

function noteFailure(reason: string): void {
	status.backend = 'memory';
	status.degraded = Boolean(import.meta.env.UPSTASH_REDIS_REST_URL);
	status.lastError = reason;
	if (!warned) {
		warned = true;
		console.warn(
			JSON.stringify({
				event: 'crm_store_memory_fallback',
				detail:
					'CRM data is held in-process only: UPSTASH_REDIS_REST_URL/TOKEN are missing or unreachable. Leads survive the request, not the deployment.',
				reason,
			}),
		);
	}
}

/** Runs a pipeline; returns `null` when Redis is unavailable (call the fallback). */
async function redis(cmds: Cmd[]): Promise<unknown[] | null> {
	const url = import.meta.env.UPSTASH_REDIS_REST_URL;
	const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN;
	if (!url || !token) {
		noteFailure('credentials_missing');
		return null;
	}

	try {
		const response = await fetch(`${String(url).replace(/\/$/, '')}/pipeline`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(cmds),
			cache: 'no-store',
		});
		if (!response.ok) {
			noteFailure(`http_${response.status}`);
			return null;
		}
		const rows = (await response.json()) as Array<{ result?: unknown; error?: string }>;
		const failed = rows.find((row) => row?.error);
		if (failed) {
			noteFailure(String(failed.error));
			return null;
		}
		status.backend = 'upstash';
		status.degraded = false;
		status.lastError = null;
		return rows.map((row) => row?.result ?? null);
	} catch (error) {
		noteFailure(error instanceof Error ? error.message : 'unknown');
		return null;
	}
}

/* -------------------------------------------------------------------------- */
/* In-process fallback                                                        */
/* -------------------------------------------------------------------------- */

interface MemoryDb {
	leads: Map<string, CrmLead>;
	timeIdx: Map<string, number>;
	emailIdx: Map<string, string>;
	events: Map<string, CrmEvent[]>;
	days: Map<string, Record<string, number>>;
	tasks: Map<string, CrmTask>;
	taskIdx: Map<string, number>;
	report: HermesReport | null;
}

const mem: MemoryDb = {
	leads: new Map(),
	timeIdx: new Map(),
	emailIdx: new Map(),
	events: new Map(),
	days: new Map(),
	tasks: new Map(),
	taskIdx: new Map(),
	report: null,
};

/** Bounded: a hostile burst must not grow the instance forever. */
const MEMORY_MAX_LEADS = 2000;

function pruneMemory(): void {
	if (mem.leads.size <= MEMORY_MAX_LEADS) return;
	const oldest = [...mem.timeIdx.entries()]
		.sort((a, b) => a[1] - b[1])
		.slice(0, mem.leads.size - MEMORY_MAX_LEADS);
	for (const [id] of oldest) {
		mem.leads.delete(id);
		mem.timeIdx.delete(id);
		mem.events.delete(id);
	}
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function emailKey(email: string): string {
	const pepper = String(import.meta.env.CRM_INDEX_PEPPER ?? import.meta.env.CONTACT_RATE_LIMIT_PEPPER ?? '');
	return createHash('sha256').update(`${pepper}:${email.toLowerCase().trim()}`).digest('hex').slice(0, 40);
}

function parseJson<T>(value: unknown): T | null {
	if (typeof value !== 'string' || !value) return null;
	try {
		return JSON.parse(value) as T;
	} catch {
		return null;
	}
}

/* -------------------------------------------------------------------------- */
/* Leads                                                                      */
/* -------------------------------------------------------------------------- */

export async function saveLead(lead: CrmLead): Promise<void> {
	const doc = JSON.stringify(lead);
	const results = await redis([['SET', `crm:lead:${lead.id}`, doc], ['ZADD', 'crm:idx:time', lead.createdAt, lead.id]]);
	if (results) {
		await redis([['SET', `crm:idx:email:${emailKey(lead.email)}`, lead.id]]);
		return;
	}

	mem.leads.set(lead.id, lead);
	mem.timeIdx.set(lead.id, lead.createdAt);
	mem.emailIdx.set(emailKey(lead.email), lead.id);
	pruneMemory();
}

/**
 * Records a lead for the first time **and** the daily counters.
 *
 * Deliberately separate from `saveLead`: every PATCH also re-saves the document
 * (status, note, delivery), and counting those would inflate the chart by one
 * bar per edit.
 */
export async function insertLead(lead: CrmLead): Promise<void> {
	const day = dayKey(lead.createdAt);
	const counters: Cmd[] = [
		['HINCRBY', `crm:metrics:${day}`, 'leads', 1],
		['HINCRBY', `crm:metrics:${day}`, `service:${lead.service || 'Unspecified'}`, 1],
		['HINCRBY', `crm:metrics:${day}`, `form:${lead.form}`, 1],
	];

	const results = await redis([
		['SET', `crm:lead:${lead.id}`, JSON.stringify(lead)],
		['ZADD', 'crm:idx:time', lead.createdAt, lead.id],
		['SET', `crm:idx:email:${emailKey(lead.email)}`, lead.id],
		...counters,
	]);
	if (results) return;

	mem.leads.set(lead.id, lead);
	mem.timeIdx.set(lead.id, lead.createdAt);
	mem.emailIdx.set(emailKey(lead.email), lead.id);
	const bucket = mem.days.get(day) ?? {};
	bucket.leads = (bucket.leads ?? 0) + 1;
	const serviceKey = `service:${lead.service || 'Unspecified'}`;
	bucket[serviceKey] = (bucket[serviceKey] ?? 0) + 1;
	const formKey = `form:${lead.form}`;
	bucket[formKey] = (bucket[formKey] ?? 0) + 1;
	mem.days.set(day, bucket);
	pruneMemory();
}

export async function getLead(id: string): Promise<CrmLead | null> {
	const results = await redis([['GET', `crm:lead:${id}`]]);
	if (results) return parseJson<CrmLead>(results[0]);
	return mem.leads.get(id) ?? null;
}

/** Lookup used to keep one lead per visitor address. */
export async function findLeadByEmail(email: string): Promise<CrmLead | null> {
	const key = emailKey(email);
	const results = await redis([['GET', `crm:idx:email:${key}`]]);
	if (results) {
		const id = results[0];
		return typeof id === 'string' && id ? getLead(id) : null;
	}
	const id = mem.emailIdx.get(key);
	return id ? (mem.leads.get(id) ?? null) : null;
}

export interface LeadQuery {
	status?: LeadStatus | null;
	/** Free-text match over name, email, service, location and message. */
	query?: string;
	/** Newest first. */
	limit?: number;
	offset?: number;
}

export interface LeadPage {
	leads: CrmLead[];
	total: number;
}

/**
 * Reads the most recent window of leads and filters in memory. At studio
 * volume (hundreds, not millions) one pipeline beats a search index, and it
 * keeps the same code path for Redis and the fallback.
 */
export async function listLeads({ status, query, limit = 200, offset = 0 }: LeadQuery = {}): Promise<LeadPage> {
	const window = Math.max(limit + offset, 200);
	let ids: string[] = [];

	const results = await redis([
		['ZREVRANGE', 'crm:idx:time', '0', String(window - 1)],
	]);
	if (results) {
		const raw = results[0];
		ids = Array.isArray(raw) ? (raw as string[]) : [];
	} else {
		ids = [...mem.timeIdx.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
	}

	let docs: CrmLead[] = [];
	let fromRedis = false;
	if (results && ids.length) {
		const fetched = await redis(ids.map((id) => ['GET', `crm:lead:${id}`]));
		if (fetched) {
			fromRedis = true;
			docs = fetched.map((row) => parseJson<CrmLead>(row)).filter((row): row is CrmLead => row !== null);
		}
	} else if (!results) {
		docs = [...mem.leads.values()];
	}

	// A failed read on a Redis-backed index must not present an empty pipeline:
	// fall back to what this instance still holds, exactly as the write path does.
	if (!fromRedis && results) docs = [...mem.leads.values()];

	const needle = query?.trim().toLowerCase() ?? '';
	const filtered = docs.filter((lead) => {
		if (status && lead.status !== status) return false;
		if (!needle) return true;
		return [lead.name, lead.email, lead.service, lead.location, lead.message, lead.form]
			.join(' ')
			.toLowerCase()
			.includes(needle);
	});

	filtered.sort((a, b) => b.createdAt - a.createdAt);
	return { leads: filtered.slice(offset, offset + limit), total: filtered.length };
}

export async function allLeads(): Promise<CrmLead[]> {
	const page = await listLeads({ limit: 5000 });
	return page.leads;
}

/* -------------------------------------------------------------------------- */
/* Timeline events                                                            */
/* -------------------------------------------------------------------------- */

export async function pushEvent(leadId: string, event: CrmEvent): Promise<void> {
	const member = JSON.stringify(event);
	const results = await redis([['ZADD', `crm:events:${leadId}`, event.ts, member]]);
	if (results) return;
	const list = mem.events.get(leadId) ?? [];
	list.push(event);
	mem.events.set(leadId, list);
}

export async function listEvents(leadId: string): Promise<CrmEvent[]> {
	const results = await redis([['ZRANGE', `crm:events:${leadId}`, '0', '-1']]);
	if (results) {
		const raw = results[0];
		if (!Array.isArray(raw)) return [];
		return (raw as string[]).map((row) => parseJson<CrmEvent>(row)).filter((e): e is CrmEvent => e !== null);
	}
	return mem.events.get(leadId) ?? [];
}

/* -------------------------------------------------------------------------- */
/* Daily counters                                                             */
/* -------------------------------------------------------------------------- */

/** `{'2026-09-13': 4, …}` for the last `days` calendar days (UTC). */
export async function dailyCounts(days = 30): Promise<Record<string, number>> {
	const keys: string[] = [];
	const now = Date.now();
	for (let i = days - 1; i >= 0; i -= 1) keys.push(dayKey(now - i * 86_400_000));

	const pipeline = await redis(keys.map((day) => ['HGETALL', `crm:metrics:${day}`]));
	if (pipeline) {
		const out: Record<string, number> = {};
		for (let i = 0; i < keys.length; i += 1) {
			const raw = pipeline[i];
			const counts = (raw && typeof raw === 'object' ? raw : {}) as Record<string, string>;
			out[keys[i]] = Number.parseInt(counts.leads ?? '0', 10) || 0;
		}
		return out;
	}

	const out: Record<string, number> = {};
	for (const day of keys) out[day] = mem.days.get(day)?.leads ?? 0;
	return out;
}

/**
 * Aggregated totals for one dimension, counted from the stored leads.
 *
 * Deliberately not read from the daily hash: the daily bucket keys are only
 * materialised per request on the in-process side, so counting the documents
 * keeps Redis and the fallback honest with one code path.
 */
export async function totalsBy(field: 'service' | 'form' | 'location'): Promise<Record<string, number>> {
	const leads = await allLeads();
	const out: Record<string, number> = {};
	for (const lead of leads) {
		const label =
			field === 'service'
				? lead.service || 'Unspecified'
				: field === 'location'
					? lead.location || 'Unspecified'
					: lead.form || 'contact';
		out[label] = (out[label] ?? 0) + 1;
	}
	return out;
}

/* -------------------------------------------------------------------------- */
/* Follow-up tasks                                                            */
/* -------------------------------------------------------------------------- */

export async function saveTask(task: CrmTask): Promise<void> {
	const results = await redis([
		['SET', `crm:task:${task.id}`, JSON.stringify(task)],
		['ZADD', 'crm:idx:tasks', task.dueAt, task.id],
	]);
	if (results) return;
	mem.tasks.set(task.id, task);
	mem.taskIdx.set(task.id, task.dueAt);
}

export async function listTasks(): Promise<CrmTask[]> {
	const results = await redis([['ZRANGE', 'crm:idx:tasks', '0', '-1']]);
	let ids: string[] = [];
	if (results) {
		const raw = results[0];
		ids = Array.isArray(raw) ? (raw as string[]) : [];
	} else {
		ids = [...mem.taskIdx.keys()].sort((a, b) => (mem.taskIdx.get(a) ?? 0) - (mem.taskIdx.get(b) ?? 0));
	}
	if (!ids.length) return [];

	if (results) {
		const fetched = await redis(ids.map((id) => ['GET', `crm:task:${id}`]));
		if (fetched) {
			return fetched
				.map((row) => parseJson<CrmTask>(row))
				.filter((task): task is CrmTask => task !== null)
				.sort((a, b) => a.dueAt - b.dueAt);
		}
	}

	return [...mem.tasks.values()].sort((a, b) => a.dueAt - b.dueAt);
}

export async function getTask(id: string): Promise<CrmTask | null> {
	const results = await redis([['GET', `crm:task:${id}`]]);
	if (results) return parseJson<CrmTask>(results[0]);
	return mem.tasks.get(id) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Hermes report                                                              */
/* -------------------------------------------------------------------------- */

export async function saveReport(report: HermesReport): Promise<void> {
	const results = await redis([['SET', 'crm:report:last', JSON.stringify(report)]]);
	if (results) return;
	mem.report = report;
}

export async function getReport(): Promise<HermesReport | null> {
	const results = await redis([['GET', 'crm:report:last']]);
	if (results) return parseJson<HermesReport>(results[0]);
	return mem.report;
}
