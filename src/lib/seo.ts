/**
 * Centralized SEO system.
 *
 * All structured data is built here so every page emits accurate, reusable
 * JSON-LD instead of hand-rolled scripts. Schemas must describe real
 * information only — do not inject a schema type a page cannot justify.
 */
import { SITE, PERSON, absoluteUrl } from '../config';
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

/**
 * OG images must be ≤ ~1200px and universally supported (JPEG). Generates a
 * derived asset from any astro:assets image instead of shipping the original
 * multi-MB file to social crawlers and the deploy bundle.
 */
export async function ogFromImage(img: ImageMetadata): Promise<string> {
	const derived = await getImage({ src: img, width: 1200, format: 'jpeg', quality: 70 });
	return derived.src;
}

export interface SeoProps {
	title: string;
	description: string;
	/** Path or absolute URL; converted to an absolute canonical automatically. */
	canonical?: string;
	ogType?: 'website' | 'article';
	ogImage?: string;
	/** Set false for draft/sitemap-only pages (e.g. HTML sitemap). */
	noindex?: boolean;
}

export interface BreadcrumbEntry {
	name: string;
	url: string;
}

const DEFAULT_OG_IMAGE = absoluteUrl('/og-default.svg');

export function buildCanonical(path?: string): string {
	return absoluteUrl(path ?? '/');
}

export function organizationSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': ['ProfessionalService', 'LocalBusiness'],
		'@id': `${SITE.url}/#organization`,
		name: SITE.name,
		alternateName: 'Paula Ambrosio Interior Design',
		description: SITE.description,
		url: SITE.url,
		email: SITE.email,
		telephone: SITE.phoneE164,
		priceRange: '$$$$',
		image: DEFAULT_OG_IMAGE,
		logo: absoluteUrl('/logo.png'),
		founder: { '@id': `${SITE.url}/#paula-ambrosio` },
		address: {
			'@type': 'PostalAddress',
			addressLocality: 'Miami',
			addressRegion: 'FL',
			addressCountry: 'US',
		},
		areaServed: [
			'Miami',
			'Miami Beach',
			'Sunny Isles Beach',
			'Aventura',
			'Bal Harbour',
			'Boca Raton',
			'Palm Beach',
			'South Florida',
		],
		sameAs: PERSON.sameAs,
	};
}

export function personSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'Person',
		'@id': `${SITE.url}/#paula-ambrosio`,
		name: PERSON.name,
		jobTitle: PERSON.jobTitle,
		url: PERSON.url,
		worksFor: { '@id': `${SITE.url}/#organization` },
		sameAs: [...PERSON.sameAs],
	};
}

export function websiteSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${SITE.url}/#website`,
		url: SITE.url,
		name: SITE.name,
		publisher: { '@id': `${SITE.url}/#organization` },
		inLanguage: 'en-US',
	};
}

export function webPageSchema(params: {
	path: string;
	title: string;
	description: string;
	breadcrumbs?: BreadcrumbEntry[];
}) {
	const graph: object[] = [
		{
			'@type': 'WebPage',
			'@id': absoluteUrl(params.path),
			url: absoluteUrl(params.path),
			name: params.title,
			description: params.description,
			isPartOf: { '@id': `${SITE.url}/#website` },
			about: { '@id': `${SITE.url}/#organization` },
			inLanguage: 'en-US',
		},
	];
	if (params.breadcrumbs?.length) {
		graph.push(breadcrumbSchema(params.breadcrumbs));
	}
	return { '@context': 'https://schema.org', '@graph': graph };
}

export function breadcrumbSchema(items: BreadcrumbEntry[]) {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: [{ name: 'Home', url: SITE.url }, ...items].map((item, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: item.name,
			item: absoluteUrl(item.url),
		})),
	};
}

export function articleSchema(params: {
	path: string;
	title: string;
	description: string;
	datePublished: Date;
	dateModified?: Date;
	author: string;
	image: string;
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		'@id': `${absoluteUrl(params.path)}#article`,
		headline: params.title,
		description: params.description,
		image: absoluteUrl(params.image),
		datePublished: params.datePublished.toISOString(),
		dateModified: (params.dateModified ?? params.datePublished).toISOString(),
		author: { '@type': 'Person', name: params.author },
		publisher: { '@id': `${SITE.url}/#organization` },
		mainEntityOfPage: { '@id': absoluteUrl(params.path) },
	};
}

export function serviceSchema(params: {
	path: string;
	name: string;
	description: string;
	areaServed?: string[];
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Service',
		'@id': `${absoluteUrl(params.path)}#service`,
		name: params.name,
		description: params.description,
		url: absoluteUrl(params.path),
		serviceType: params.name,
		provider: { '@id': `${SITE.url}/#organization` },
		areaServed: params.areaServed ?? ['Miami', 'South Florida'],
	};
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((f) => ({
			'@type': 'Question',
			name: f.question,
			acceptedAnswer: { '@type': 'Answer', text: f.answer },
		})),
	};
}

/** Renders a JSON-LD script tag. */
export function schemaScript(data: object): string {
	return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}
