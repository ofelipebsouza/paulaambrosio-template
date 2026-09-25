/**
 * Lead enrichment — everything the request itself can tell us, resolved
 * server-side with no external service and no extra round trip.
 *
 *   · IP        first `x-forwarded-for` hop (Vercel injects the client address)
 *   · geo       `x-vercel-ip-country` / `-city` / `-latitude` / `-longitude` /
 *               `-timezone`, injected by the platform for free. The city value
 *               is base64-encoded by Vercel. Absent outside production.
 *   · device    User-Agent, truncated and lightly parsed for display only
 *   · referrer  full URL, truncated
 *   · UTM       read from the forms' hidden fields, filled by the browser
 *
 * Nothing here is ever logged raw, sent to Analytics or included in a webhook:
 * the records live only in the lead document behind the dashboard session.
 */
import type { LeadContext, LeadFlag, LeadGeo, LeadUtm } from './schema';

const UA_LIMIT = 300;
const URL_LIMIT = 500;
const LANDING_LIMIT = 300;

/* -------------------------------------------------------------------------- */
/* Request → context                                                          */
/* -------------------------------------------------------------------------- */

function header(request: Request, name: string): string {
	return (request.headers.get(name) ?? '').trim();
}

/** Vercel sends the city URL-safe-base64 encoded (it may contain non-ASCII). */
function decodeCity(value: string): string {
	if (!value) return '';
	try {
		const decoded = Buffer.from(value, 'base64').toString('utf8');
		// A raw base64 city would be gibberish; keep the original when unsure.
		return /^[\p{L}\p{N} .,'()-]+$/u.test(decoded) ? decoded.trim() : value;
	} catch {
		return value;
	}
}

export function geoFromHeaders(request: Request): LeadGeo {
	const geo: LeadGeo = {};
	const country = header(request, 'x-vercel-ip-country');
	const city = header(request, 'x-vercel-ip-city');
	const region = header(request, 'x-vercel-ip-country-region');
	const lat = header(request, 'x-vercel-ip-latitude');
	const lng = header(request, 'x-vercel-ip-longitude');
	const tz = header(request, 'x-vercel-ip-timezone');

	if (/^[A-Z]{2}$/.test(country)) geo.country = country;
	if (city) geo.city = decodeCity(city).slice(0, 80);
	if (region) geo.region = region.slice(0, 80);
	if (/^-?\d{1,3}(\.\d+)?$/.test(lat)) geo.lat = lat;
	if (/^-?\d{1,3}(\.\d+)?$/.test(lng)) geo.lng = lng;
	if (/^[\w/+-]{1,64}$/.test(tz)) geo.tz = tz;
	return geo;
}

/* -------------------------------------------------------------------------- */
/* User-Agent                                                                 */
/* -------------------------------------------------------------------------- */

const AUTOMATION_HINTS = /\b(bot|crawler|spider|curl|wget|python-requests|scrapy|headless|phantomjs|java\/|libwww)\b/i;

/**
 * The raw agent, truncated, plus the display hints the dialog shows. The
 * parse is deliberately forgiving: an unknown agent is still stored.
 */
export function parseUserAgent(raw: string): { agent: string; flag: LeadFlag | null } {
	const agent = raw.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, UA_LIMIT);
	if (!agent) return { agent: '', flag: 'missing_ua' };
	if (AUTOMATION_HINTS.test(agent)) return { agent, flag: 'automation_ua' };
	return { agent, flag: null };
}

/** Browser / OS / device hints for the lead dialog. Display only. */
export function describeDevice(userAgent: string): string {
	if (!userAgent) return 'Unknown device';
	const browser = /Edg\//.test(userAgent)
		? 'Edge'
		: /OPR\//.test(userAgent)
			? 'Opera'
			: /Firefox\//.test(userAgent)
				? 'Firefox'
				: /Chrome\//.test(userAgent)
					? 'Chrome'
					: /Safari\//.test(userAgent)
						? 'Safari'
						: /bot|crawler|spider/i.test(userAgent)
							? 'Bot'
							: 'Browser';
	const os = /Windows/.test(userAgent)
		? 'Windows'
		: /iPhone|iPad|iOS/.test(userAgent)
			? 'iOS'
			: /Android/.test(userAgent)
				? 'Android'
				: /Mac OS X/.test(userAgent)
					? 'macOS'
					: /Linux/.test(userAgent)
						? 'Linux'
						: '';
	const device = /iPad|Tablet/i.test(userAgent)
		? 'tablet'
		: /Mobile|iPhone|Android/i.test(userAgent)
			? 'phone'
			: 'desktop';
	return [browser, os, device].filter(Boolean).join(' · ');
}

/* -------------------------------------------------------------------------- */
/* UTM                                                                        */
/* -------------------------------------------------------------------------- */

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

/** Free text from a query string: length-capped, control chars removed. */
function cleanUtm(value: unknown): string {
	if (typeof value !== 'string') return '';
	return value.replace(/[\u0000-\u001F\u007F<>"]/g, '').trim().slice(0, 80);
}

/**
 * Reads the hidden campaign fields the browser fills from `location.search`.
 * Attribution for the CRM lives here — deliberately never in Analytics events
 * (docs/analytics.md keeps campaign data out of the platform entirely).
 */
export function utmFromRaw(raw: Record<string, unknown>): LeadUtm {
	const utm: LeadUtm = {};
	const source = cleanUtm(raw.utm_source);
	const medium = cleanUtm(raw.utm_medium);
	const campaign = cleanUtm(raw.utm_campaign);
	const content = cleanUtm(raw.utm_content);
	const term = cleanUtm(raw.utm_term);
	if (source) utm.source = source;
	if (medium) utm.medium = medium;
	if (campaign) utm.campaign = campaign;
	if (content) utm.content = content;
	if (term) utm.term = term;
	return utm;
}

export function utmSummary(utm: LeadUtm): string {
	const parts = [utm.source, utm.medium, utm.campaign].filter(Boolean);
	return parts.length ? parts.join(' / ') : '';
}

/* -------------------------------------------------------------------------- */
/* Assembly                                                                   */
/* -------------------------------------------------------------------------- */

export interface EnrichmentInput {
	request: Request;
	ip: string;
	raw: Record<string, unknown>;
	/** True when this address already produced a lead recently. */
	repeatSubmitter: boolean;
}

const DISPOSABLE_DOMAINS = new Set([
	'tempmail.com',
	'temp-mail.org',
	'temp-mail.io',
	'mailinator.com',
	'guerrillamail.com',
	'guerrillamail.info',
	'grr.la',
	'10minutemail.com',
	'10minutemail.net',
	'yopmail.com',
	'yopmail.fr',
	'sharklasers.com',
	'spamgourmet.com',
	'mohmal.com',
	'throwawaymail.com',
	'tempail.com',
	'trashmail.com',
	'tempinbox.com',
	'discard.email',
	'discardmail.com',
	'maildrop.cc',
	'mailnesia.com',
	'mailcatch.com',
	'mailtemp.info',
	'linshiyouxiang.net',
	'getnada.com',
	'33mail.com',
	'byom.de',
	' trashmail.com'.trim(),
	'temp-mail.ru',
	'fakeinbox.com',
	'inboxbear.com',
	'sogetthis.com',
	'spoofmail.de',
	'mailforspam.com',
	'free-temp-mail.com',
	'temporarymail.com',
	'emytrash.com',
	'wegwerfemail.de',
	'wegwerfemailaddress.com',
]);

export function isDisposableDomain(email: string): boolean {
	const at = email.lastIndexOf('@');
	if (at < 0) return false;
	return DISPOSABLE_DOMAINS.has(email.slice(at + 1).toLowerCase().trim());
}

/**
 * One call that turns the request into the enrichment block of a lead.
 * Flags mark a record for review — the lead is always stored, never dropped:
 * blocking is a decision for the team, made on the Security panel.
 */
export function buildEnrichment({ request, ip, raw, repeatSubmitter }: EnrichmentInput): LeadContext {
	const userAgent = header(request, 'user-agent');
	const { agent, flag: uaFlag } = parseUserAgent(userAgent);

	const referrer = header(request, 'referer').slice(0, URL_LIMIT);

	let landing = '';
	try {
		const url = new URL(referrer);
		landing = (url.pathname + url.search).slice(0, LANDING_LIMIT);
	} catch {
		// Direct visits and malformed referrers simply have no landing path.
	}

	const flags: LeadFlag[] = [];
	const email = typeof raw.email === 'string' ? String(raw.email) : '';
	if (isDisposableDomain(email)) flags.push('disposable_email');
	if (repeatSubmitter) flags.push('repeat_submitter');
	if (uaFlag) flags.push(uaFlag);

	return {
		ip,
		geo: geoFromHeaders(request),
		userAgent: agent,
		referrer,
		landing,
		utm: utmFromRaw(raw),
		flags,
	};
}
