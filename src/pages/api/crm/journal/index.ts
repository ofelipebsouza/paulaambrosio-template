/**
 * /api/crm/journal/ — Journal CRUD for Studio Admin.
 *
 * GET  — list all posts (draft, scheduled, published).
 * POST — create or schedule a new post.
 */
import type { APIRoute } from 'astro';
import { requireCrm } from '../../../../lib/crm/guard';
import { crmJson } from '../../../../lib/crm/http';
import { listJournalPosts, saveJournalPost } from '../../../../lib/journal/store';
import { slugify, type JournalPost } from '../../../../lib/journal/schema';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
	const denied = requireCrm(request);
	if (denied) return denied;

	if (request.method === 'GET') {
		const url = new URL(request.url);
		const status = url.searchParams.get('status') as JournalPost['status'] | 'all' | null;
		const posts = await listJournalPosts({ status: status || 'all', limit: 100 });
		return crmJson({ ok: true, posts });
	}

	if (request.method === 'POST') {
		const body = (await request.json().catch(() => ({}))) as Partial<JournalPost>;
		if (!body.title || !body.content) {
			return crmJson({ ok: false, error: 'title_and_content_required' }, 400);
		}

		const now = Date.now();
		const id = body.id ? slugify(body.id) : slugify(body.title);
		const status = body.status || 'draft';
		const scheduledFor = body.scheduledFor ? Number(body.scheduledFor) : undefined;

		const post: JournalPost = {
			id,
			title: String(body.title).trim(),
			excerpt: String(body.excerpt || '').trim() || String(body.content).slice(0, 160).trim(),
			content: String(body.content).trim(),
			featuredImage: String(body.featuredImage || '/images/hero-1.webp').trim(),
			imageAlt: String(body.imageAlt || body.title).trim(),
			category: String(body.category || 'Trends').trim(),
			status,
			publishedAt: status === 'published' ? (body.publishedAt || now) : now,
			scheduledFor: status === 'scheduled' ? scheduledFor : undefined,
			author: String(body.author || 'Paula Ambrosio').trim(),
			seoTitle: body.seoTitle ? String(body.seoTitle).trim() : undefined,
			seoDescription: body.seoDescription ? String(body.seoDescription).trim() : undefined,
			views: 0,
			createdAt: now,
			updatedAt: now,
			source: 'manual',
		};

		await saveJournalPost(post);
		return crmJson({ ok: true, post }, 201);
	}

	return crmJson({ ok: false, error: 'method_not_allowed' }, 405);
};
