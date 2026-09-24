/**
 * Rate limiting for the inquiry endpoint.
 *
 * Vercel functions are ephemeral and horizontally scaled, so an in-process
 * counter is **not** real protection: it only damps accidental double submits
 * that happen to hit the same instance. Distributed protection comes from
 * Upstash Redis over REST, enabled by:
 *
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * With no Redis configured the limiter degrades to best-effort memory and
 * reports that backend, so the caller (and the documentation) never pretends
 * the protection is distributed when it is not.
 */
import { createHash } from 'node:crypto';

export interface RateLimitResult {
	allowed: boolean;
	/** Which counter produced the answer — logged with every rate-limit hit. */
	backend: 'upstash' | 'memory' | 'unconfigured';
	limit: number;
	remaining: number | null;
	retryAfterSeconds: number;
}

interface MemoryBucket {
	count: number;
	resetAt: number;
}

/** Fallback bucket store. Bounded so a hostile burst cannot grow it forever. */
const memoryBuckets = new Map<string, MemoryBucket>();
const MEMORY_MAX_KEYS = 5000;

let warnedAboutMemory = false;

function positiveInt(value: string | undefined, fallback: number): number {
	const parsed = Number.parseInt(String(value ?? ''), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function rateLimitConfig(): { limit: number; windowSeconds: number } {
	return {
		limit: positiveInt(import.meta.env.CONTACT_RATE_LIMIT, 5),
		windowSeconds: positiveInt(import.meta.env.CONTACT_RATE_LIMIT_WINDOW, 600),
	};
}

/**
 * Non-reversible key for a visitor identifier (IP): we only need to count
 * repetitions, never to know who they were. A pepper can rotate the keys.
 */
export function hashIdentifier(identifier: string): string {
	const pepper = String(import.meta.env.CONTACT_RATE_LIMIT_PEPPER ?? '');
	return createHash('sha256').update(`${pepper}:${identifier}`).digest('hex').slice(0, 32);
}

export async function checkRateLimit(identifierHash: string): Promise<RateLimitResult> {
	const { limit, windowSeconds } = rateLimitConfig();
	const windowStart = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
	const key = `rl:contact:${identifierHash}:${windowStart}`;
	const ttl = windowSeconds + 5;
	const retryAfterSeconds = windowStart + windowSeconds - Math.floor(Date.now() / 1000);

	const url = import.meta.env.UPSTASH_REDIS_REST_URL;
	const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

	if (url && token) {
		try {
			const response = await fetch(`${String(url).replace(/\/$/, '')}/pipeline`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify([
					['INCR', key],
					['EXPIRE', key, ttl, 'NX'],
				]),
				cache: 'no-store',
			});

			if (response.ok) {
				const results = (await response.json()) as Array<{ result?: number; error?: string }>;
				const counted = results[0]?.result;
				const failed = results.some((entry) => entry?.error);
				if (typeof counted === 'number' && !failed) {
					return {
						allowed: counted <= limit,
						backend: 'upstash',
						limit,
						remaining: Math.max(0, limit - counted),
						retryAfterSeconds: Math.max(1, retryAfterSeconds),
					};
				}
			}
			console.error(
				JSON.stringify({ event: 'rate_limit_backend_error', status: response.status, backend: 'upstash' }),
			);
		} catch (error) {
			console.error(
				JSON.stringify({
					event: 'rate_limit_backend_error',
					backend: 'upstash',
					reason: error instanceof Error ? error.message : 'unknown',
				}),
			);
		}
	}

	return memoryFallback(key, limit, retryAfterSeconds, Boolean(url && token));
}

/**
 * Best-effort counter. Deliberately reported as `memory` (or `unconfigured`
 * when Redis was expected but unreachable) so monitoring can tell the
 * difference between protection and a placebo.
 */
function memoryFallback(
	key: string,
	limit: number,
	retryAfterSeconds: number,
	redisExpected: boolean,
): RateLimitResult {
	const now = Date.now();

	for (const [bucketKey, bucket] of memoryBuckets) {
		if (bucket.resetAt <= now) memoryBuckets.delete(bucketKey);
	}
	if (memoryBuckets.size > MEMORY_MAX_KEYS) {
		for (const bucketKey of memoryBuckets.keys()) {
			memoryBuckets.delete(bucketKey);
			if (memoryBuckets.size <= MEMORY_MAX_KEYS / 2) break;
		}
	}

	const bucket = memoryBuckets.get(key) ?? { count: 0, resetAt: now + retryAfterSeconds * 1000 };
	bucket.count += 1;
	memoryBuckets.set(key, bucket);

	if (!redisExpected && !warnedAboutMemory) {
		warnedAboutMemory = true;
		console.warn(
			JSON.stringify({
				event: 'rate_limit_memory_only',
				detail:
					'UPSTASH_REDIS_REST_URL/TOKEN are not set: inquiries are throttled with an in-process counter that Vercel cannot enforce across instances. Configure Upstash for real protection.',
			}),
		);
	}

	return {
		allowed: bucket.count <= limit,
		backend: redisExpected ? 'unconfigured' : 'memory',
		limit,
		remaining: Math.max(0, limit - bucket.count),
		retryAfterSeconds: Math.max(1, retryAfterSeconds),
	};
}
