/** Explicit intake categories; safe to share with the contact form and CRM UI. */
import {
	BUDGET_TIERS, LEGACY_BUDGET_OPTIONS, ORIGIN_OPTIONS,
	type InvestmentTier, type LeadOrigin,
} from './contact-form';
export { BUDGET_HELP, INTAKE_VERSION, LEAD_ORIGINS, ORIGIN_OPTIONS, LEGACY_BUDGET_OPTIONS, leadOriginLabel } from './contact-form';
export type { InvestmentTier, LeadOrigin } from './contact-form';

export const RECOMMENDED_SERVICES = ['Consultation', 'Express', 'Residential', 'Turnkey'] as const;
export type RecommendedService = (typeof RECOMMENDED_SERVICES)[number];

export function currentInvestmentTier(budget: unknown): InvestmentTier | undefined {
	return BUDGET_TIERS.find((option) => option.label === budget)?.tier;
}

export function investmentTierFor(budget: unknown): InvestmentTier {
	return currentInvestmentTier(budget)
		?? (budget === LEGACY_BUDGET_OPTIONS[0] || budget === LEGACY_BUDGET_OPTIONS[1] ? 'T2'
			: budget === LEGACY_BUDGET_OPTIONS[2] ? 'T3'
			: budget === LEGACY_BUDGET_OPTIONS[3] ? 'T4' : 'Unsure');
}

export function recommendedServiceFor(tier: InvestmentTier, selectedService = ''): RecommendedService | undefined {
	if (tier === 'T1') return selectedService === 'Design Express' ? 'Express' : 'Consultation';
	if (tier === 'T2') return 'Residential';
	if (tier === 'T3' || tier === 'T4') return 'Turnkey';
	return undefined;
}

export function isPriorityIntake(tier: InvestmentTier | undefined): boolean {
	return tier === 'T3' || tier === 'T4';
}

function classifyCampaign(source: unknown): LeadOrigin | undefined {
	const normalized = typeof source === 'string' ? source.trim().toLowerCase() : '';
	if (normalized === 'google' || normalized === 'google_ads' || normalized === 'googleads' || normalized === 'gads') return 'google';
	if (normalized === 'instagram' || normalized === 'ig') return 'instagram';
	if (normalized === 'houzz') return 'houzz';
	if (normalized === 'referral') return 'referral';
	if (normalized === 'broker' || normalized === 'realtor') return 'broker';
	if (normalized === 'website' || normalized === 'site') return 'website';
	return undefined;
}

/** Use the visitor's answer first, then a recognized campaign/referrer. No raw URL is returned. */
export function resolveLeadOrigin(report?: unknown, utm?: unknown, referrer?: unknown): LeadOrigin | undefined {
	if (typeof report === 'string' && (ORIGIN_OPTIONS as readonly string[]).includes(report)) return report as LeadOrigin;
	const campaign = classifyCampaign(utm);
	if (campaign) return campaign;
	if (typeof referrer !== 'string' || !referrer) return undefined;
	try {
		const url = new URL(referrer);
		if (!['https:', 'http:'].includes(url.protocol)) return undefined;
		const host = url.hostname.toLowerCase().replace(/\.$/, '');
		if (host === 'houzz.com' || host.endsWith('.houzz.com')) return 'houzz';
		if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram';
		if (/^(?:www\.)?google\.(?:com|ca|co\.uk|com\.br|fr|de|es|com\.mx)$/.test(host)) return 'google';
	} catch {
		// An absent or malformed header is not a source signal.
	}
	return undefined;
}

export const DEFAULT_NEXT_STEP = 'Review inquiry and follow up';

/** Calendar date of the 24-hour callback target in the studio's timezone. */
export function studioFollowUpDate(now: number): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
	}).formatToParts(now + 86_400_000);
	const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
	return `${part('year')}-${part('month')}-${part('day')}`;
}

export function validNextStepDate(value: unknown): value is string {
	if (value === '') return true;
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(value + 'T00:00:00Z');
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && Number(value.slice(0, 4)) >= 2000;
}
