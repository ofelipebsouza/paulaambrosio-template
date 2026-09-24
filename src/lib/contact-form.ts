/**
 * Contact form contract — the single source of truth shared by the page that
 * renders the form, the client script that submits it and the API route that
 * validates it. Plain data only (no Node APIs, no imports) so it can be used on
 * both sides without pulling anything into the browser bundle.
 *
 * Field names here must match the `<input name>` attributes exactly: they are
 * the keys of the lead email and of the analytics metadata.
 */

/** Server endpoint that receives inquiries. */
export const CONTACT_API_PATH = '/api/contact';

/** Field length limits, enforced server-side and mirrored as `maxlength`. */
export const FIELD_LIMITS = {
	name: 100,
	email: 200,
	phone: 50,
	location: 150,
	propertyType: 60,
	service: 80,
	budget: 40,
	timeline: 40,
	message: 3000,
} as const;

/** Invisible field: filled means bot. Never validated, never emailed. */
export const HONEYPOT_FIELD = 'website';

/** Cloudflare Turnstile writes its token into this field name. */
export const TURNSTILE_FIELD = 'cf-turnstile-response';

export const SERVICE_OPTIONS = [
	'Full-Service Interior Design',
	'Turnkey Interior Design',
	'Luxury Residential Interior Design',
	'New Construction',
	'Renovation',
	'Hospitality Interior Design',
	'Other',
] as const;

export const LOCATION_OPTIONS = [
	'Miami',
	'Miami Beach',
	'Sunny Isles Beach',
	'Aventura',
	'Bal Harbour',
	'Boca Raton',
	'Palm Beach',
	'Other / International',
] as const;

export const PROPERTY_TYPE_OPTIONS = [
	'Primary Residence',
	'Second Home',
	'Condo / Apartment',
	'Single-Family Home',
	'New Construction',
	'Commercial / Hospitality',
	'Other',
] as const;

export const BUDGET_OPTIONS = [
	'$100k – $250k',
	'$250k – $500k',
	'$500k – $1M',
	'$1M+',
	'Prefer to discuss',
] as const;

export const TIMELINE_OPTIONS = ['Immediately', '1–3 months', '3–6 months', '6–12 months', 'Flexible'] as const;

export type ContactTextField = 'name' | 'email' | 'phone' | 'location' | 'propertyType' | 'service' | 'budget' | 'timeline' | 'message';

export interface ContactFieldSpec {
	/** Form field name (also the email label source and analytics key). */
	name: ContactTextField;
	label: string;
	required: boolean;
	/** Value must be one of these options when present. */
	options?: readonly string[];
	/** Single-line fields lose line breaks; the message keeps them. */
	multiline?: boolean;
}

/**
 * Canonical field order — drives the email body, the validation loop and the
 * server-side sanitisation. Requirements follow the studio's request: name,
 * email, project location, service and message are mandatory.
 */
export const CONTACT_FIELDS: readonly ContactFieldSpec[] = [
	{ name: 'name', label: 'Name', required: true },
	{ name: 'email', label: 'Email', required: true },
	{ name: 'phone', label: 'Phone', required: false },
	{ name: 'location', label: 'Project Location', required: true },
	{ name: 'propertyType', label: 'Property Type', required: false, options: PROPERTY_TYPE_OPTIONS },
	{ name: 'service', label: 'Service', required: true, options: SERVICE_OPTIONS },
	{ name: 'budget', label: 'Approximate Budget', required: false, options: BUDGET_OPTIONS },
	{ name: 'timeline', label: 'Desired Timeline', required: false, options: TIMELINE_OPTIONS },
	{ name: 'message', label: 'Message', required: true, multiline: true },
] as const;

export type ContactFieldName = ContactFieldSpec['name'];

/** Wording for the two forms' analytics `form` metadata. */
export const CONTACT_FORM_IDS = {
	contact: 'contact',
	inquiry: 'project_inquiry',
} as const;
