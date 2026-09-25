/**
 * Schema and types for Studio Journal (Blog) posts.
 *
 * Supports manual publishing via Admin and automated publication/drafting
 * via the Hermes Agent. Posts can be published immediately or scheduled
 * for future release.
 */

export type JournalStatus = 'draft' | 'scheduled' | 'published';

export interface JournalPost {
	id: string; // URL slug, e.g. "curating-quiet-luxury-interiors-miami"
	title: string;
	excerpt: string;
	content: string; // Markdown / rich text
	featuredImage: string; // URL of cover image
	imageAlt: string;
	category: string;
	status: JournalStatus;
	publishedAt: number; // Unix timestamp ms
	scheduledFor?: number; // Unix timestamp ms (when status === 'scheduled')
	author: string;
	seoTitle?: string;
	seoDescription?: string;
	views: number;
	createdAt: number;
	updatedAt: number;
	source: 'manual' | 'hermes';
}

export const JOURNAL_CATEGORIES = [
	'Trends',
	'Living',
	'Architecture',
	'Design',
	'Materials',
	'News',
] as const;

export function slugify(text: string): string {
	return text
		.toString()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 100);
}

export function estimateReadingTime(content: string): number {
	const words = (content || '').trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / 200));
}
