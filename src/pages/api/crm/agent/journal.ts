/**
 * POST /api/crm/agent/journal/ — Hermes creating or scheduling articles.
 *
 * Authenticated via HMAC signature (`x-hermes-signature`) or static token (`x-hermes-token`).
 */
import type { APIRoute } from 'astro';
import { requireHermes, verifyBodySignature } from '../../../../lib/crm/guard';
import { saveJournalPost, getJournalPost } from '../../../../lib/journal/store';
import { slugify, type JournalPost } from '../../../../lib/journal/schema';

export const prerender = false;

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
	});
}

export const POST: APIRoute = async ({ request }) => {
	const denied = requireHermes(request);
	if (denied) return denied;

	let rawBody = '';
	try {
		rawBody = await request.text();
	} catch {
		return json({ ok: false, error: 'unreadable_body' }, 400);
	}

	if (import.meta.env.HERMES_WEBHOOK_SECRET) {
		const sig = request.headers.get('x-hermes-signature') || '';
		if (!verifyBodySignature(rawBody, sig, import.meta.env.HERMES_WEBHOOK_SECRET)) {
			return json({ ok: false, error: 'bad_signature' }, 401);
		}
	}

	let body: Partial<JournalPost> = {};
	try {
		body = JSON.parse(rawBody) as Partial<JournalPost>;
	} catch {
		return json({ ok: false, error: 'invalid_json' }, 400);
	}

	if (!body.title || !body.content) {
		return json({ ok: false, error: 'title_and_content_required' }, 422);
	}

	const now = Date.now();
	const id = body.id ? slugify(body.id) : slugify(body.title);
	const existing = await getJournalPost(id);

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
		publishedAt: status === 'published' ? (body.publishedAt || now) : (existing?.publishedAt || now),
		scheduledFor: status === 'scheduled' ? scheduledFor : undefined,
		author: String(body.author || 'Paula Ambrosio').trim(),
		seoTitle: body.seoTitle ? String(body.seoTitle).trim() : undefined,
		seoDescription: body.seoDescription ? String(body.seoDescription).trim() : undefined,
		views: existing?.views || 0,
		createdAt: existing?.createdAt || now,
		updatedAt: now,
		source: 'hermes',
	};

	await saveJournalPost(post);
	return json({ ok: true, post, created: !existing }, existing ? 200 : 201);
};
