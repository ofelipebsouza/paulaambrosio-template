/**
 * CRM metrics — pure calculations over stored leads.
 *
 * Everything here is deterministic and side-effect free so the dashboard, the
 * Hermes payload and the reminder email all read the same numbers. Percentages
 * are ratios in 0…1; the client decides how to round them.
 */
import { LEAD_STATUSES, OPEN_STATUSES, dayKey, normalizeStatus, type CrmLead, type CrmTask, type JevTemperature, type LeadStatus } from './schema';

/** Won / closed inside one bucket — what the "what converts" cards render. */
export interface ConversionBucket {
	won: number;
	closed: number;
	/** 0…1, or 0 while nothing in the bucket has closed. */
	rate: number;
}

/** JEV coverage plus its verdicts over the scored leads. */
export interface JevMetrics {
	/** Leads that carry a score. */
	scored: number;
	/** Leads waiting for one. */
	unclassified: number;
	/** Mean score of the scored leads, 0…1. */
	avgScore: number | null;
	/** Mean urgency of the scored leads, 0…1. */
	avgUrgency: number | null;
	byTemperature: Record<JevTemperature, number>;
	/** Hot leads still in the pipeline — the number worth acting on today. */
	hotOpen: number;
	/** Hot leads already won. */
	hotWon: number;
	/** Scored as spam, still listed because the CRM never drops a lead. */
	spam: number;
}

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
	/** UTM source, or `direct` when the visitor arrived without a campaign. */
	bySource: Record<string, number>;

	/** JEV verdicts over the leads that carry a score. */
	jev: JevMetrics;
	/** Won / closed grouped for the "what actually converts" cards. */
	convByService: Record<string, ConversionBucket>;
	convByBudget: Record<string, ConversionBucket>;
	convBySource: Record<string, ConversionBucket>;

	/** % change of the last 30 days against the previous 30; null without history. */
	growth30: number | null;
	/** Mean age of the leads still in the pipeline, in hours. */
	avgOpenAgeHours: number | null;
	/** First response time over leads received in the last 30 days. */
	responseBuckets: { within1h: number; within6h: number; within24h: number; later: number; unanswered: number };

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
	const bySource: Record<string, number> = {};
	const convByService: Record<string, ConversionBucket> = {};
	const convByBudget: Record<string, ConversionBucket> = {};
	const convBySource: Record<string, ConversionBucket> = {};

	const count = (bucket: Record<string, number>, key: string): void => {
		bucket[key] = (bucket[key] ?? 0) + 1;
	};

	/** Won / closed inside one bucket; the rate only means something once closed. */
	const conv = (buckets: Record<string, ConversionBucket>, key: string, won: boolean, closed: boolean): void => {
		const bucket = (buckets[key] ??= { won: 0, closed: 0, rate: 0 });
		if (won) bucket.won += 1;
		if (closed) bucket.closed += 1;
		bucket.rate = bucket.closed > 0 ? bucket.won / bucket.closed : 0;
	};

	/** Campaign source of one lead, with the honest default for a typed URL. */
	const sourceOf = (lead: CrmLead): string => (lead.utm?.source || '').trim().toLowerCase() || 'direct';

	const todayKey = dayKey(now);
	let last30 = 0;
	let prev30 = 0;
	let today = 0;
	let open = 0;
	let awaitingReply = 0;
	let closed = 0;
	let won = 0;
	let responseHoursTotal = 0;
	let responseSamples = 0;
	let openAgeHoursTotal = 0;
	let openAgeSamples = 0;

	const responseBuckets = { within1h: 0, within6h: 0, within24h: 0, later: 0, unanswered: 0 };
	const jev: JevMetrics = {
		scored: 0,
		unclassified: 0,
		avgScore: null,
		avgUrgency: null,
		byTemperature: { hot: 0, warm: 0, cold: 0, spam: 0 },
		hotOpen: 0,
		hotWon: 0,
		spam: 0,
	};
	let scoreTotal = 0;
	let urgencyTotal = 0;

	for (const lead of leads) {
		// Pre-Kanban records may still carry `em_contato`; count them in the
		// current funnel instead of creating a bucket with no column.
		const status = normalizeStatus(lead.status);
		const isOpen = OPEN_STATUSES.includes(status);
		const isWon = status === 'fechado';
		const isLost = status === 'perdido';

		byStatus[status] = (byStatus[status] ?? 0) + 1;
		count(byService, lead.service || 'Unspecified');
		count(byLocation, lead.location || 'Unspecified');
		count(byForm, lead.form || 'contact');
		count(bySource, sourceOf(lead));
		if (lead.budget) count(byBudget, lead.budget);

		// Conversion needs both halves: the bucket only moves once a lead
		// closes, so open leads add to nothing here.
		const serviceKey = lead.service || 'Unspecified';
		const budgetKey = lead.budget || 'Not stated';
		const sourceKey = sourceOf(lead);
		if (isWon || isLost) {
			conv(convByService, serviceKey, isWon, true);
			conv(convByBudget, budgetKey, isWon, true);
			conv(convBySource, sourceKey, isWon, true);
		}

		const age = now - lead.createdAt;
		if (age <= 30 * DAY) last30 += 1;
		else if (age <= 60 * DAY) prev30 += 1;
		if (dayKey(lead.createdAt) === todayKey) today += 1;

		if (isOpen) {
			open += 1;
			openAgeHoursTotal += age / 3_600_000;
			openAgeSamples += 1;
			if (!lead.firstResponseAt) awaitingReply += 1;
		} else {
			closed += 1;
			if (isWon) won += 1;
		}

		// Response-time buckets use the same 30-day window as `last30`, so the
		// distribution and the headline number describe the same population.
		if (age <= 30 * DAY) {
			if (!lead.firstResponseAt) {
				responseBuckets.unanswered += 1;
			} else {
				const hours = (lead.firstResponseAt - lead.createdAt) / 3_600_000;
				if (hours <= 1) responseBuckets.within1h += 1;
				else if (hours <= 6) responseBuckets.within6h += 1;
				else if (hours <= 24) responseBuckets.within24h += 1;
				else responseBuckets.later += 1;
			}
		}

		if (lead.firstResponseAt && lead.firstResponseAt >= lead.createdAt) {
			responseHoursTotal += (lead.firstResponseAt - lead.createdAt) / 3_600_000;
			responseSamples += 1;
		}

		if (lead.jev) {
			jev.scored += 1;
			scoreTotal += lead.jev.score;
			urgencyTotal += lead.jev.urgency;
			const temperature = lead.jev.temperature;
			jev.byTemperature[temperature] = (jev.byTemperature[temperature] ?? 0) + 1;
			if (temperature === 'hot' && isOpen) jev.hotOpen += 1;
			if (temperature === 'hot' && isWon) jev.hotWon += 1;
			if (temperature === 'spam') jev.spam += 1;
		} else {
			jev.unclassified += 1;
		}
	}

	const overdue = tasks.filter((task) => task.state === 'open' && task.dueAt <= now).length;
	const sortByRate = (bucket: Record<string, ConversionBucket>): Record<string, ConversionBucket> =>
		Object.fromEntries(Object.entries(bucket).sort((a, b) => b[1].closed - a[1].closed));

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
		bySource: sortByValue(bySource),
		jev: {
			...jev,
			avgScore: jev.scored > 0 ? scoreTotal / jev.scored : null,
			avgUrgency: jev.scored > 0 ? urgencyTotal / jev.scored : null,
		},
		convByService: sortByRate(convByService),
		convByBudget: sortByRate(convByBudget),
		convBySource: sortByRate(convBySource),
		growth30: prev30 > 0 ? (last30 - prev30) / prev30 : null,
		avgOpenAgeHours: openAgeSamples > 0 ? openAgeHoursTotal / openAgeSamples : null,
		responseBuckets,
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
