/**
 * Persistence for Journal posts.
 *
 * Backed by Upstash Redis over REST with an in-memory fallback.
 * Keys (prefixed `journal:`):
 *   journal:post:{id}       JSON document
 *   journal:idx:time        ZSET score = publishedAt member = id
 *   journal:idx:scheduled   ZSET score = scheduledFor member = id
 */
import { slugify, type JournalPost } from './schema';

type Cmd = (string | number)[];

function parseJson<T>(value: unknown): T | null {
	if (typeof value !== 'string' || !value) return null;
	try {
		return JSON.parse(value) as T;
	} catch {
		return null;
	}
}

async function redis(cmds: Cmd[]): Promise<unknown[] | null> {
	const url = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.UPSTASH_REDIS_REST_URL : (typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_URL : undefined);
	const token = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.UPSTASH_REDIS_REST_TOKEN : (typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_TOKEN : undefined);
	if (!url || !token) return null;

	try {
		const response = await fetch(`${String(url).replace(/\/$/, '')}/pipeline`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(cmds),
			cache: 'no-store',
		});
		if (!response.ok) return null;
		const rows = (await response.json()) as Array<{ result?: unknown; error?: string }>;
		const failed = rows.find((r) => r?.error);
		if (failed) return null;
		return rows.map((r) => r?.result ?? null);
	} catch {
		return null;
	}
}

/* In-process fallback */
const memPosts = new Map<string, JournalPost>();

export async function saveJournalPost(post: JournalPost): Promise<void> {
	post.updatedAt = Date.now();
	const doc = JSON.stringify(post);
	const cmds: Cmd[] = [['SET', `journal:post:${post.id}`, doc]];

	if (post.status === 'published') {
		cmds.push(['ZADD', 'journal:idx:time', post.publishedAt, post.id]);
		cmds.push(['ZREM', 'journal:idx:scheduled', post.id]);
	} else if (post.status === 'scheduled' && post.scheduledFor) {
		cmds.push(['ZADD', 'journal:idx:scheduled', post.scheduledFor, post.id]);
		cmds.push(['ZREM', 'journal:idx:time', post.id]);
	} else {
		// draft
		cmds.push(['ZREM', 'journal:idx:time', post.id]);
		cmds.push(['ZREM', 'journal:idx:scheduled', post.id]);
	}

	const res = await redis(cmds);
	if (res) return;
	memPosts.set(post.id, post);
}

export async function getJournalPost(id: string): Promise<JournalPost | null> {
	const cleanId = slugify(id);
	const res = await redis([['GET', `journal:post:${cleanId}`]]);
	if (res && res[0]) {
		return parseJson<JournalPost>(res[0]);
	}
	return memPosts.get(cleanId) ?? null;
}

export async function deleteJournalPost(id: string): Promise<boolean> {
	const cleanId = slugify(id);
	const res = await redis([
		['DEL', `journal:post:${cleanId}`],
		['ZREM', 'journal:idx:time', cleanId],
		['ZREM', 'journal:idx:scheduled', cleanId],
	]);
	memPosts.delete(cleanId);
	return res ? true : true;
}

export async function incrementPostViews(id: string): Promise<void> {
	const post = await getJournalPost(id);
	if (!post) return;
	post.views = (post.views || 0) + 1;
	await saveJournalPost(post);
}

export interface ListPostsOptions {
	status?: JournalPost['status'] | 'all';
	limit?: number;
	offset?: number;
}

export async function listJournalPosts(options: ListPostsOptions = {}): Promise<JournalPost[]> {
	const { status = 'published', limit = 50, offset = 0 } = options;

	// Check and publish any due scheduled posts lazily
	await publishDuePosts();

	let ids: string[] = [];
	if (status === 'published') {
		const res = await redis([['ZREVRANGE', 'journal:idx:time', String(offset), String(offset + limit - 1)]]);
		if (res && Array.isArray(res[0])) {
			ids = res[0] as string[];
		} else {
			ids = [...memPosts.values()]
				.filter((p) => p.status === 'published' && p.publishedAt <= Date.now())
				.sort((a, b) => b.publishedAt - a.publishedAt)
				.map((p) => p.id)
				.slice(offset, offset + limit);
		}
	} else if (status === 'scheduled') {
		const res = await redis([['ZRANGE', 'journal:idx:scheduled', '0', '-1']]);
		if (res && Array.isArray(res[0])) {
			ids = res[0] as string[];
		} else {
			ids = [...memPosts.values()]
				.filter((p) => p.status === 'scheduled')
				.sort((a, b) => (a.scheduledFor ?? 0) - (b.scheduledFor ?? 0))
				.map((p) => p.id);
		}
	} else {
		// 'all' or 'draft'
		// fetch published + scheduled + any scan
		const res = await redis([
			['ZREVRANGE', 'journal:idx:time', '0', '-1'],
			['ZRANGE', 'journal:idx:scheduled', '0', '-1'],
		]);
		if (res) {
			const pub = Array.isArray(res[0]) ? (res[0] as string[]) : [];
			const sch = Array.isArray(res[1]) ? (res[1] as string[]) : [];
			ids = Array.from(new Set([...pub, ...sch]));
		} else {
			ids = [...memPosts.keys()];
		}
	}

	if (!ids.length && memPosts.size > 0) {
		ids = [...memPosts.keys()];
	}

	let posts: JournalPost[] = [];
	if (ids.length) {
		const res = await redis(ids.map((id) => ['GET', `journal:post:${id}`]));
		if (res) {
			posts = res
				.map((r) => parseJson<JournalPost>(r))
				.filter((p): p is JournalPost => p !== null);
		} else {
			posts = ids
				.map((id) => memPosts.get(id))
				.filter((p): p is JournalPost => p !== undefined);
		}
	}

	if (status !== 'all') {
		posts = posts.filter((p) => p.status === status);
	}

	posts.sort((a, b) => b.updatedAt - a.updatedAt);
	return posts.slice(offset, offset + limit);
}

/**
 * Checks all scheduled posts whose time has passed and flips them to published.
 */
export async function publishDuePosts(): Promise<number> {
	const now = Date.now();
	const res = await redis([['ZRANGEBYSCORE', 'journal:idx:scheduled', '0', String(now)]]);
	let dueIds: string[] = [];
	if (res && Array.isArray(res[0])) {
		dueIds = res[0] as string[];
	} else {
		dueIds = [...memPosts.values()]
			.filter((p) => p.status === 'scheduled' && (p.scheduledFor ?? 0) <= now)
			.map((p) => p.id);
	}

	let publishedCount = 0;
	for (const id of dueIds) {
		const post = await getJournalPost(id);
		if (post && post.status === 'scheduled') {
			post.status = 'published';
			post.publishedAt = post.scheduledFor || now;
			await saveJournalPost(post);
			publishedCount++;
		}
	}
	return publishedCount;
}
