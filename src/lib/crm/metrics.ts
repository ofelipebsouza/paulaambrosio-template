/**
 * CRM metrics — pure calculations over stored leads.
 *
 * Everything here is deterministic and side-effect free so the dashboard, the
 * Hermes payload and the reminder email all read the same numbers. Percentages
 * are ratios in 0…1; the client decides how to round them.
 */
import { LEAD_STATUSES, OPEN_STATUSES, dayKey, type CrmLead, type CrmTask, type LeadStatus } from './schema';

export interface CrmMetrics {
	/** Counters. */
	total: number;
	last30: number;
	today: number;
	/** Leads still in the pipeline (not won, not lost). */
	open: number;
	/** Received in the last 24 h. */
	newToday: number;
	/** Open leads with no recorded first response. */
	awaitingReply: number;
	/** Won + lost over everything received. */
	conversionRate: number;
	/** Median-ish mean of (first response − received), in hours. */
	avgFirstResponseHours: number | null;

	/** Funnel: every status with its count. */
	byStatus: Record<LeadStatus, number>;
	byService: Record<string, number>;
	byLocation: Record<string, number>;
	byForm: Record<string, number>;
	byBudget: Record<string, number>;

	/** `YYYY-MM-DD` → lead count, for the bar chart. */
	daily: Record<string, number>;

	/** Follow-up queue. */
	tasksOpen: number;
	tasksOverdue: number;
}

const DAY = 86_400_000;

export function buildMetrics({
	leads,
	tasks,
	daily,
	now = Date.now(),
}: {
	leads: CrmLead[];
	tasks: CrmTask[];
	daily: Record<string, number>;
	now?: number;
}): CrmMetrics {
	const byStatus = Object.fromEntries(LEAD_STATUSES.map((status) => [status, 0])) as Record<LeadStatus, number>;
	const byService: Record<string, number> = {};
	const byLocation: Record<string, number> = {};
	const byForm: Record<string, number> = {};
	const byBudget: Record<string, number> = {};

	const count = (bucket: Record<string, number>, key: string): void => {
		bucket[key] = (bucket[key] ?? 0) + 1;
	};

	const todayKey = dayKey(now);
	let last30 = 0;
	let today = 0;
	let open = 0;
	let awaitingReply = 0;
	let closed = 0;
	let won = 0;
	let responseHoursTotal = 0;
	let responseSamples = 0;

	for (const lead of leads) {
		byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
		count(byService, lead.service || 'Unspecified');
		count(byLocation, lead.location || 'Unspecified');
		count(byForm, lead.form || 'contact');
		if (lead.budget) count(byBudget, lead.budget);

		if (now - lead.createdAt <= 30 * DAY) last30 += 1;
		if (dayKey(lead.createdAt) === todayKey) today += 1;

		if (OPEN_STATUSES.includes(lead.status)) {
			open += 1;
			if (!lead.firstResponseAt) awaitingReply += 1;
		} else {
			closed += 1;
			if (lead.status === 'fechado') won += 1;
		}

		if (lead.firstResponseAt && lead.firstResponseAt >= lead.createdAt) {
			responseHoursTotal += (lead.firstResponseAt - lead.createdAt) / 3_600_000;
			responseSamples += 1;
		}
	}

	const overdue = tasks.filter((task) => task.state === 'open' && task.dueAt <= now).length;

	return {
		total: leads.length,
		last30,
		today,
		open,
		newToday: today,
		awaitingReply,
		conversionRate: closed > 0 ? won / closed : 0,
		avgFirstResponseHours: responseSamples > 0 ? responseHoursTotal / responseSamples : null,
		byStatus,
		byService: sortByValue(byService),
		byLocation: sortByValue(byLocation),
		byForm: sortByValue(byForm),
		byBudget: sortByValue(byBudget),
		daily,
		tasksOpen: tasks.filter((task) => task.state === 'open').length,
		tasksOverdue: overdue,
	};
}

function sortByValue(bucket: Record<string, number>): Record<string, number> {
	return Object.fromEntries(Object.entries(bucket).sort((a, b) => b[1] - a[1]));
}

/** Ratio 0…1 of leads answered within `hours` of arriving. */
export function responseRate(leads: CrmLead[], hours = 24, now = Date.now()): number {
	const recent = leads.filter((lead) => now - lead.createdAt <= 30 * DAY);
	if (!recent.length) return 0;
	const answered = recent.filter(
		(lead) => lead.firstResponseAt !== null && (lead.firstResponseAt - lead.createdAt) / 3_600_000 <= hours,
	);
	return answered.length / recent.length;
}
