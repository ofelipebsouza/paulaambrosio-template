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
	email: 'info@paulaambrosio.com',
	phone: '+1 (786) 658-9478',
	phone2: '+1 (786) 208-5412',
	phoneE164: '+17866589478',
	address: '1938 NE 149th St, North Miami, FL 33181',
	locale: 'en_US',
} as const;

export const PERSON = {
	name: 'Paula Ambrosio',
	jobTitle: 'Principal Designer & Cofounder',
	url: `${SITE.url}/about`,
	sameAs: [
		'https://www.instagram.com/paulaambrosio_',
		'https://www.linkedin.com/in/paula-ambrosio-99b908246',
		'https://www.houzz.com/pro/paulaambrosio',
	],
} as const;

/** Canonical flat URLs per the SEO plan (§14): legacy Framer paths stay canonical. */
export const serviceUrl = (id: string): string => `/${id}`;
export const locationUrl = (id: string): string =>
	id === 'miami'
		? '/interior-design-miami'
		: id === 'sunny-isles-beach'
			? '/interior-designer-sunny-isles'
			: `/interior-designer-${id}`;
export const projectUrl = (id: string): string => `/projects/${id}`;

export const FOOTER_LOCATIONS = [
	{ label: 'Miami', href: locationUrl('miami') },
	{ label: 'Miami Beach', href: locationUrl('miami-beach') },
	{ label: 'Sunny Isles Beach', href: locationUrl('sunny-isles-beach') },
	{ label: 'Aventura', href: locationUrl('aventura') },
	{ label: 'Bal Harbour', href: locationUrl('bal-harbour') },
	{ label: 'Boca Raton', href: locationUrl('boca-raton') },
	{ label: 'Palm Beach', href: locationUrl('palm-beach') },
] as const;

/**
 * Desktop navigation mirrors the reference layout: three links either side
 * of the centered wordmark. Items with `children` render a hover dropdown
 * (desktop) and an expandable group (mobile menu).
 */
export const NAV_LEFT = [
	{ label: 'Home', href: '/' },
	{ label: 'About', href: '/about' },
	{
		label: 'Services',
		href: '/services',
		children: [
			{ label: 'All Services', href: '/services' },
			{ label: 'Design Consultation', href: serviceUrl('design-consultation-miami') },
			{ label: 'Turnkey Interior Design', href: serviceUrl('turnkey-interior-design-miami') },
			{ label: 'Luxury Residential Design', href: serviceUrl('luxury-residential-interior-design-miami') },
			{ label: 'Hospitality Interior Design', href: serviceUrl('hospitality-interior-design-miami') },
		],
	},
	{ label: 'Projects', href: '/projects' },
] as const;

export const NAV_RIGHT = [
	{
		label: 'Locations',
		href: '/locations',
		children: FOOTER_LOCATIONS.map((loc) => ({ label: loc.label, href: loc.href })),
	},
	{ label: 'Journal', href: '/journal' },
	{ label: 'Privacy', href: '/privacy' },
	{ label: 'Contact', href: '/contact' },
] as const;

/** Every navigation destination, in menu order — used by the mobile menu. */
export const NAV_LINKS = [...NAV_LEFT.slice(1), ...NAV_RIGHT] as const;

/** Studio social profiles — real destinations only (§42). */
export const SOCIAL_LINKS = [
	{ label: 'Instagram', href: 'https://www.instagram.com/paulaambrosio_' },
	{ label: 'TikTok', href: 'https://www.tiktok.com/@thepaulaambrosio' },
	{ label: 'Threads', href: 'https://www.threads.net/@paulaambrosio_' },
	{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/paula-ambrosio-99b908246' },
	{ label: 'Houzz', href: 'https://www.houzz.com/pro/paulaambrosio' },
] as const;

/** Absolute URL helper — keeps canonicals/OG images correct on any host. */
export function absoluteUrl(path: string): string {
	if (path.startsWith('http')) return path;
	return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;
}
