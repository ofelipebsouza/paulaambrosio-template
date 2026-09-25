/**
 * Internal analytics store backed by Upstash Redis (with memory fallback).
 *
 * Tracks:
 *   - Total pageviews & daily pageviews
 *   - Views per page (top pages)
 *   - Conversions & click events (whatsapp, phone, email, form submits)
 *   - Referrers / Traffic sources
 */

type Cmd = (string | number)[];

function dayString(ts: number = Date.now()): string {
	return new Date(ts).toISOString().slice(0, 10);
}

async function redis(cmds: Cmd[]): Promise<unknown[] | null> {
	const url = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.UPSTASH_REDIS_REST_URL : (typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_URL : undefined);
	const token = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.UPSTASH_REDIS_REST_TOKEN : (typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_TOKEN : undefined);
	if (!url || !token) return null;

	try {
		const response = await fetch(`${String(url).replace(/\/$/, '')}/pipeline`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(cmds),
			cache: 'no-store',
		});
		if (!response.ok) return null;
		const rows = (await response.json()) as Array<{ result?: unknown; error?: string }>;
		return rows.map((r) => r?.result ?? null);
	} catch {
		return null;
	}
}

/* In-process memory fallback */
interface MemAnalytics {
	dailyViews: Map<string, number>;
	dailyPages: Map<string, Map<string, number>>;
	dailyEvents: Map<string, Map<string, number>>;
	topPages: Map<string, number>;
	referrers: Map<string, number>;
}

const memAnalytics: MemAnalytics = {
	dailyViews: new Map(),
	dailyPages: new Map(),
	dailyEvents: new Map(),
	topPages: new Map(),
	referrers: new Map(),
};

export interface TrackPayload {
	page: string;
	event?: string;
	referrer?: string;
}

export async function recordPageView(page: string, referrer?: string): Promise<void> {
	const cleanPage = page.split('?')[0].replace(/\/$/, '') || '/';
	const day = dayString();

	const cmds: Cmd[] = [
		['INCR', `analytics:views:total`],
		['INCR', `analytics:daily:${day}:views`],
		['HINCRBY', `analytics:daily:${day}:pages`, cleanPage, 1],
		['ZINCRBY', `analytics:top_pages`, 1, cleanPage],
	];

	if (referrer) {
		try {
			const parsed = new URL(referrer);
			const refHost = parsed.hostname.replace(/^www\./, '');
			if (refHost && !refHost.includes('paulaambrosio.com')) {
				cmds.push(['ZINCRBY', `analytics:referrers`, 1, refHost]);
			}
		} catch {
			// ignore invalid referrer url
		}
	}

	const res = await redis(cmds);
	if (res) return;

	// Fallback in memory
	memAnalytics.dailyViews.set(day, (memAnalytics.dailyViews.get(day) ?? 0) + 1);
	const pagesMap = memAnalytics.dailyPages.get(day) ?? new Map<string, number>();
	pagesMap.set(cleanPage, (pagesMap.get(cleanPage) ?? 0) + 1);
	memAnalytics.dailyPages.set(day, pagesMap);

	memAnalytics.topPages.set(cleanPage, (memAnalytics.topPages.get(cleanPage) ?? 0) + 1);
	if (referrer) {
		try {
			const refHost = new URL(referrer).hostname.replace(/^www\./, '');
			if (refHost && !refHost.includes('paulaambrosio.com')) {
				memAnalytics.referrers.set(refHost, (memAnalytics.referrers.get(refHost) ?? 0) + 1);
			}
		} catch {
			// ignore
		}
	}
}

export async function recordEvent(event: string, page: string): Promise<void> {
	const day = dayString();
	const cleanEvent = event.trim().toLowerCase();

	const cmds: Cmd[] = [
		['HINCRBY', `analytics:daily:${day}:events`, cleanEvent, 1],
		['HINCRBY', `analytics:events:total`, cleanEvent, 1],
	];

	const res = await redis(cmds);
	if (res) return;

	const eventsMap = memAnalytics.dailyEvents.get(day) ?? new Map<string, number>();
	eventsMap.set(cleanEvent, (eventsMap.get(cleanEvent) ?? 0) + 1);
	memAnalytics.dailyEvents.set(day, eventsMap);
}

export interface AnalyticsSummary {
	totalViews: number;
	viewsLast30Days: number;
	viewsToday: number;
	dailyHistory: Array<{ day: string; views: number }>;
	topPages: Array<{ page: string; views: number }>;
	topEvents: Record<string, number>;
	topReferrers: Array<{ referrer: string; count: number }>;
}

export async function getAnalyticsSummary(days = 30): Promise<AnalyticsSummary> {
	const dayList: string[] = [];
	const now = Date.now();
	for (let i = days - 1; i >= 0; i--) {
		dayList.push(dayString(now - i * 86_400_000));
	}

	const cmds: Cmd[] = [
		['GET', `analytics:views:total`],
		['ZREVRANGE', `analytics:top_pages`, '0', '9', 'WITHSCORES'],
		['HGETALL', `analytics:events:total`],
		['ZREVRANGE', `analytics:referrers`, '0', '5', 'WITHSCORES'],
		...dayList.map((d) => ['GET', `analytics:daily:${d}:views`] as Cmd),
	];

	const res = await redis(cmds);

	let totalViews = 0;
	let viewsToday = 0;
	const dailyHistory: Array<{ day: string; views: number }> = [];
	const topPages: Array<{ page: string; views: number }> = [];
	let topEvents: Record<string, number> = {};
	const topReferrers: Array<{ referrer: string; count: number }> = [];

	if (res) {
		totalViews = Number.parseInt(String(res[0] ?? '0'), 10) || 0;

		// top pages
		const rawPages = (Array.isArray(res[1]) ? res[1] : []) as string[];
		for (let i = 0; i < rawPages.length; i += 2) {
			topPages.push({ page: rawPages[i], views: Number.parseInt(rawPages[i + 1] ?? '0', 10) || 0 });
		}

		// top events
		const rawEvents = (res[2] && typeof res[2] === 'object' ? res[2] : {}) as Record<string, string>;
		for (const [k, v] of Object.entries(rawEvents)) {
			topEvents[k] = Number.parseInt(v, 10) || 0;
		}

		// referrers
		const rawRefs = (Array.isArray(res[3]) ? res[3] : []) as string[];
		for (let i = 0; i < rawRefs.length; i += 2) {
			topReferrers.push({ referrer: rawRefs[i], count: Number.parseInt(rawRefs[i + 1] ?? '0', 10) || 0 });
		}

		// daily views
		for (let i = 0; i < dayList.length; i++) {
			const count = Number.parseInt(String(res[4 + i] ?? '0'), 10) || 0;
			dailyHistory.push({ day: dayList[i], views: count });
		}
	} else {
		// Memory fallback
		for (const count of memAnalytics.dailyViews.values()) {
			totalViews += count;
		}
		for (const d of dayList) {
			dailyHistory.push({ day: d, views: memAnalytics.dailyViews.get(d) ?? 0 });
		}
		const sortedPages = [...memAnalytics.topPages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
		for (const [page, views] of sortedPages) {
			topPages.push({ page, views });
		}
		const sortedRefs = [...memAnalytics.referrers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
		for (const [referrer, count] of sortedRefs) {
			topReferrers.push({ referrer, count });
		}
		topEvents = {};
		for (const eventsMap of memAnalytics.dailyEvents.values()) {
			for (const [k, v] of eventsMap.entries()) {
				topEvents[k] = (topEvents[k] ?? 0) + v;
			}
		}
	}

	viewsToday = dailyHistory[dailyHistory.length - 1]?.views ?? 0;
	const viewsLast30Days = dailyHistory.reduce((sum, d) => sum + d.views, 0);

	return {
		totalViews,
		viewsLast30Days,
		viewsToday,
		dailyHistory,
		topPages,
		topEvents,
		topReferrers,
	};
}
