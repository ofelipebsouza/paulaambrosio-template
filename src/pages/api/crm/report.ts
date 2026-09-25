/**
 * GET  /api/crm/report/ — the latest Hermes report.
 * POST /api/crm/report/ — Hermes delivering a new one.
 *
 * Two callers, two credentials:
 *   · the dashboard (session cookie) reads the report to render it;
 *   · Hermes itself pulls with `x-hermes-token: $HERMES_TOKEN` and receives the
 *     KPI payload it needs to write the next report;
 *   · Hermes pushes back with a body signature (`x-hermes-signature` =
 *     sha256=HMAC-SHA256(rawBody, HERMES_WEBHOOK_SECRET)) or, failing that,
 *     with the same static token.
 *
 * The report is advisory: when it is missing or malformed the dashboard falls
 * back to its own KPIs and says "waiting for Hermes" instead of erroring.
 */
import type { APIRoute } from 'astro';
import { requireCrm, requireHermes, verifyBodySignature } from '../../../lib/crm/guard';
import { crmJson, log } from '../../../lib/crm/http';
import { buildMetrics, responseRate } from '../../../lib/crm/metrics';
import type { HermesReport } from '../../../lib/crm/schema';
import { allLeads, dailyCounts, getReport, listTasks, saveReport, storeStatus } from '../../../lib/crm/store';

export const prerender = false;

const SUMMARY_LIMIT = 2000;
const ITEM_LIMIT = 12;
const ITEM_TEXT_LIMIT = 400;

function stringList(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value
		.filter((entry): entry is string => typeof entry === 'string')
		.map((entry) => entry.trim())
		.filter(Boolean)
		.slice(0, ITEM_LIMIT)
		.map((entry) => entry.slice(0, ITEM_TEXT_LIMIT));
}

function sanitise(raw: Record<string, unknown>): HermesReport | null {
	const summary = typeof raw.summary === 'string' ? raw.summary.trim().slice(0, SUMMARY_LIMIT) : '';
	if (!summary) return null;

	const generatedAt =
		typeof raw.generatedAt === 'number' && Number.isFinite(raw.generatedAt)
			? raw.generatedAt
			: Date.now();

	const kpis: Record<string, number> = {};
	if (raw.kpis && typeof raw.kpis === 'object' && !Array.isArray(raw.kpis)) {
		for (const [key, value] of Object.entries(raw.kpis as Record<string, unknown>)) {
			const num = typeof value === 'number' ? value : Number(value);
			if (Number.isFinite(num)) kpis[key.slice(0, 40)] = num;
		}
	}

	return {
		generatedAt,
		summary,
		highlights: stringList(raw.highlights),
		actions: stringList(raw.actions),
		...(Object.keys(kpis).length ? { kpis } : {}),
	};
}

export const ALL: APIRoute = async ({ request }) => {
	const method = request.method;

	/* ---------------------------------------------------------------- POST */
	if (method === 'POST') {
		const rawBody = await request.text();

		const secretConfigured = Boolean(String(import.meta.env.HERMES_WEBHOOK_SECRET ?? '').trim());
		const signed = verifyBodySignature(
			rawBody,
			request.headers.get('x-hermes-signature') ?? '',
			'HERMES_WEBHOOK_SECRET',
		);
		// With a webhook secret configured a signature is mandatory; without one
		// the static token is the only credential there is.
		const authorised = secretConfigured ? signed : requireHermes(request) === null;
		if (!authorised) {
			log('warn', 'crm_report_rejected', { reason: secretConfigured ? 'bad_signature' : 'no_token' });
			return crmJson({ ok: false, error: 'unauthorized' }, 401);
		}

		let parsed: Record<string, unknown>;
		try {
			parsed = JSON.parse(rawBody) as Record<string, unknown>;
		} catch {
			return crmJson({ ok: false, error: 'invalid_json' }, 400);
		}

		const report = sanitise(parsed);
		if (!report) return crmJson({ ok: false, error: 'missing_summary' }, 422);

		await saveReport(report);
		log('info', 'crm_report_received', { generatedAt: report.generatedAt, actions: report.actions.length });

		return crmJson({ ok: true, storedAt: Date.now() });
	}

	if (method !== 'GET') return crmJson({ ok: false, error: 'method_not_allowed' }, 405);

	/* ----------------------------------------------------------------- GET */
	const report = await getReport();

	// Hermes pulls: hand it everything it needs to write the next report.
	const hermes = requireHermes(request);
	if (hermes === null) {
		const now = Date.now();
		const [leads, tasks, daily] = await Promise.all([allLeads(), listTasks(), dailyCounts(30)]);
		const metrics = buildMetrics({ leads, tasks, daily, now });
		return crmJson({
			ok: true,
			report,
			metrics: { ...metrics, answeredWithin24h: responseRate(leads, 24, now) },
			leads: leads.slice(0, 100),
			storage: storeStatus(),
			generatedAt: now,
		});
	}

	// The dashboard reads it with its own session.
	const denied = requireCrm(request);
	if (denied) return denied;

	return crmJson({ ok: true, report, storage: storeStatus() });
};
