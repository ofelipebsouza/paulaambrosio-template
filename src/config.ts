/**
 * Central site configuration — single source of truth for the brand entity,
 * contact data, canonical URLs and navigation. Used by the SEO system,
 * structured-data utilities, layouts and components.
 */

export const SITE = {
	url: 'https://paulaambrosiointeriors.com',
	name: 'Paula Ambrosio Interiors',
	shortName: 'Paula Ambrosio',
	legalName: 'Paula Ambrosio Interiors LLC',
	description:
		'Miami luxury interior design studio specializing in full-service and turnkey interiors for high-end residences, penthouses, renovations and hospitality spaces across South Florida.',
	email: 'concierge@paulaambrosiointeriors.com',
	phone: '+1 (305) 555-0198',
	phoneE164: '+13055550198',
	locale: 'en_US',
} as const;

export const PERSON = {
	name: 'Paula Ambrosio',
	jobTitle: 'Founder & Principal Designer',
	url: `${SITE.url}/about`,
	sameAs: [
		'https://www.instagram.com/paulaambrosiointeriors',
		'https://www.linkedin.com/in/paulaambrosio',
		'https://www.houzz.com/pro/paulaambrosio',
	],
} as const;

export const NAV_LINKS = [
	{ label: 'Services', href: '/services' },
	{ label: 'Projects', href: '/projects' },
	{ label: 'Locations', href: '/locations' },
	{ label: 'Journal', href: '/journal' },
	{ label: 'About', href: '/about' },
	{ label: 'Contact', href: '/contact' },
] as const;

export const FOOTER_LOCATIONS = [
	{ label: 'Miami', href: '/locations/miami' },
	{ label: 'Miami Beach', href: '/locations/miami-beach' },
	{ label: 'Sunny Isles Beach', href: '/locations/sunny-isles-beach' },
	{ label: 'Aventura', href: '/locations/aventura' },
	{ label: 'Bal Harbour', href: '/locations/bal-harbour' },
	{ label: 'Boca Raton', href: '/locations/boca-raton' },
	{ label: 'Palm Beach', href: '/locations/palm-beach' },
] as const;

/** Absolute URL helper — keeps canonicals/OG images correct on any host. */
export function absoluteUrl(path: string): string {
	if (path.startsWith('http')) return path;
	return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;
}
