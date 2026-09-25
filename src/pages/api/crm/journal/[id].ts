/**
 * /api/crm/journal/[id]/ — Single Journal Post operations.
 *
 * GET    — fetch post details
 * PATCH  — update content, image, status, schedule
 * DELETE — remove post
 */
import type { APIRoute } from 'astro';
import { requireCrm } from '../../../../lib/crm/guard';
import { crmJson } from '../../../../lib/crm/http';
import { getJournalPost, saveJournalPost, deleteJournalPost } from '../../../../lib/journal/store';
import type { JournalPost } from '../../../../lib/journal/schema';

export const prerender = false;

export const ALL: APIRoute = async ({ request, params }) => {
	const denied = requireCrm(request);
	if (denied) return denied;

	const id = params.id;
	if (!id) return crmJson({ ok: false, error: 'missing_id' }, 400);

	if (request.method === 'GET') {
		const post = await getJournalPost(id);
		if (!post) return crmJson({ ok: false, error: 'not_found' }, 404);
		return crmJson({ ok: true, post });
	}

	if (request.method === 'PATCH') {
		const post = await getJournalPost(id);
		if (!post) return crmJson({ ok: false, error: 'not_found' }, 404);

		const body = (await request.json().catch(() => ({}))) as Partial<JournalPost>;
		if (body.title !== undefined) post.title = String(body.title).trim();
		if (body.excerpt !== undefined) post.excerpt = String(body.excerpt).trim();
		if (body.content !== undefined) post.content = String(body.content).trim();
		if (body.featuredImage !== undefined) post.featuredImage = String(body.featuredImage).trim();
		if (body.imageAlt !== undefined) post.imageAlt = String(body.imageAlt).trim();
		if (body.category !== undefined) post.category = String(body.category).trim();
		if (body.status !== undefined) {
			post.status = body.status;
			if (post.status === 'published' && !post.publishedAt) {
				post.publishedAt = Date.now();
			}
		}
		if (body.scheduledFor !== undefined) post.scheduledFor = Number(body.scheduledFor) || undefined;
		if (body.seoTitle !== undefined) post.seoTitle = body.seoTitle ? String(body.seoTitle).trim() : undefined;
		if (body.seoDescription !== undefined) post.seoDescription = body.seoDescription ? String(body.seoDescription).trim() : undefined;

		await saveJournalPost(post);
		return crmJson({ ok: true, post });
	}

	if (request.method === 'DELETE') {
		const success = await deleteJournalPost(id);
		return crmJson({ ok: success });
	}

	return crmJson({ ok: false, error: 'method_not_allowed' }, 405);
};
