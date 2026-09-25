/**
 * CRM automation — follow-up tasks and the JEV webhook.
 *
 * Two independent automations share this module:
 *
 *  1. Follow-up tasks. Every new lead gets a "first contact" deadline
 *     (CRM_FOLLOWUP_HOURS, default 24 h) and a "second attempt"
 *     (CRM_FOLLOWUP_SECOND_HOURS, default 72 h). The cron route scans them and
 *     the dashboard shows them as a queue, so a lead never waits silently.
 *
 *  2. JEV. When JEV_WEBHOOK_URL is configured, each lifecycle event is POSTed
 *     as a signed JSON envelope (`x-jev-signature` = HMAC-SHA256 of the raw
 *     body with JEV_WEBHOOK_SECRET). Delivery is best effort: a slow or absent
 *     automation never blocks the inquiry, the dashboard or the email.
 *
 * Nothing here logs an email address unmasked.
 */
import { hmacHex, safeHexEqual } from './guard';
import { leadRef, log } from './http';
import { newId, type CrmLead, type CrmTask } from './schema';
import { saveTask } from './store';

/* -------------------------------------------------------------------------- */
/* Follow-up tasks                                                            */
/* -------------------------------------------------------------------------- */

function positiveHours(envName: string, fallback: number): number {
	const parsed = Number.parseInt(String(import.meta.env[envName] ?? ''), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Creates the standard follow-up pair for a brand-new lead. */
export async function scheduleFollowUps(lead: CrmLead, now = Date.now()): Promise<CrmTask[]> {
	const firstHours = positiveHours('CRM_FOLLOWUP_HOURS', 24);
	const secondHours = positiveHours('CRM_FOLLOWUP_SECOND_HOURS', 72);

	const tasks: CrmTask[] = [
		makeTask({
			lead,
			title: `First contact — reply to ${lead.name}`,
			dueAt: now + firstHours * 3_600_000,
			now,
		}),
		makeTask({
			lead,
			title: `Second attempt — ${lead.name} has not heard back`,
			dueAt: now + secondHours * 3_600_000,
			now,
		}),
	];

	for (const task of tasks) await saveTask(task);
	return tasks;
}

function makeTask({ lead, title, dueAt, now }: { lead: CrmLead; title: string; dueAt: number; now: number }): CrmTask {
	return {
		id: newId(),
		leadId: lead.id,
		leadName: lead.name,
		leadEmail: lead.email,
		title,
		dueAt,
		state: 'open',
		createdAt: now,
		completedAt: null,
		remindedAt: null,
	};
}

/* -------------------------------------------------------------------------- */
/* JEV webhook                                                                */
/* -------------------------------------------------------------------------- */

export type JevEvent = 'lead.created' | 'lead.status_changed' | 'lead.responded' | 'task.overdue';

interface JevEnvelope {
	event: JevEvent;
	/** Epoch ms. */
	ts: number;
	studio: string;
	data: Record<string, unknown>;
}

function webhookUrl(): string {
	return String(import.meta.env.JEV_WEBHOOK_URL ?? '').trim();
}

/**
 * Signs and posts one event. Returns `false` when the automation is not
 * configured or the request failed — both are normal, neither is an error the
 * caller needs to handle.
 */
export async function emitJev(event: JevEvent, data: Record<string, unknown>, now = Date.now()): Promise<boolean> {
	const url = webhookUrl();
	if (!url) return false;

	const secret = String(import.meta.env.JEV_WEBHOOK_SECRET ?? '').trim();
	const envelope: JevEnvelope = { event, ts: now, studio: 'Paula Ambrosio Interiors', data };
	const body = JSON.stringify(envelope);

	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 5000);
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'paulaambrosio-crm/1.0',
				...(secret ? { 'x-jev-signature': `sha256=${hmacHex(body, secret)}` } : {}),
			},
			body,
			signal: controller.signal,
		});
		clearTimeout(timer);
		if (!response.ok) {
			log('warn', 'jev_webhook_failed', { event, status: response.status });
			return false;
		}
		log('info', 'jev_webhook_delivered', { event });
		return true;
	} catch (error) {
		log('warn', 'jev_webhook_failed', {
			event,
			reason: error instanceof Error ? error.message : 'unknown',
		});
		return false;
	}
}

/** Convenience wrapper: the lead reference every event carries. */
export function leadData(lead: CrmLead, extra: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: lead.id,
		...leadRef(lead),
		phone: lead.phone,
		service: lead.service,
		location: lead.location,
		budget: lead.budget,
		timeline: lead.timeline,
		form: lead.form,
		page: lead.page,
		status: lead.status,
		createdAt: lead.createdAt,
		...extra,
	};
}

/** Exposed for verification: signatures must match the documented scheme. */
export function verifyJevSignature(rawBody: string, signature: string): boolean {
	const secret = String(import.meta.env.JEV_WEBHOOK_SECRET ?? '').trim();
	if (!secret || !signature) return false;
	return safeHexEqual(hmacHex(rawBody, secret), signature.replace(/^sha256=/i, '').toLowerCase());
}
