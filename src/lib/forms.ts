/**
 * Contact form delivery — the single place that decides how an inquiry leaves
 * the browser.
 *
 * Two delivery modes, in order of preference:
 *
 *  1. `endpoint` — a real https:// URL configured through CONTACT_FORM_ENDPOINT
 *     (CRM, email API, webhook). The form posts to it with `fetch()` and only a
 *     2xx response is treated as a sent inquiry.
 *
 *  2. `mailto` — no endpoint configured. The form renders **without an `action`
 *     attribute**: an `action="mailto:…"` on an HTTPS page is reported by Chrome
 *     as an insecure form submission (mixed content), which fails Lighthouse
 *     `is-on-https` and drops Best Practices. Instead the client composes the
 *     inquiry into a `mailto:` URL and opens the visitor's mail client.
 *
 * Field values only ever go to the configured endpoint or to the visitor's own
 * mail client — never to analytics.
 */

export type FormDelivery = 'endpoint' | 'mailto';

/**
 * Endpoint accepted by the forms: `CONTACT_FORM_ENDPOINT`, only when it is a
 * plain https URL. Anything else (empty, http, mailto) falls back to `mailto`
 * delivery so an insecure form action can never be rendered.
 */
export function resolveFormEndpoint(): string | null {
	const raw = import.meta.env.CONTACT_FORM_ENDPOINT;
	if (typeof raw !== 'string') return null;
	const value = raw.trim();
	return /^https:\/\/[^\s]+$/i.test(value) ? value : null;
}

/** Field order and labels used when composing the inquiry email. */
const MAILTO_FIELDS: ReadonlyArray<{ name: string; label: string }> = [
	{ name: 'name', label: 'Name' },
	{ name: 'email', label: 'Email' },
	{ name: 'phone', label: 'Phone' },
	{ name: 'location', label: 'Project location' },
	{ name: 'service', label: 'Service' },
	{ name: 'message', label: 'Project details' },
];

/** Composes a `mailto:` URL from the current form values. */
export function composeMailtoHref(form: HTMLFormElement, address: string): string {
	const data = new FormData(form);
	const value = (name: string) => String(data.get(name) ?? '').trim();

	const subject = ['New project inquiry', value('service'), value('location')]
		.filter(Boolean)
		.join(' — ');

	const body = MAILTO_FIELDS.map(({ name, label }) => {
		const field = value(name);
		return field ? `${label}: ${field}` : '';
	})
		.filter(Boolean)
		.join('\n');

	return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
