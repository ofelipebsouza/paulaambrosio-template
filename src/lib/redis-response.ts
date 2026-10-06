/** Raw REST HGETALL returns alternating field/value pairs, unlike Redis SDKs. */
export function redisHashCounts(raw: unknown): Record<string, number> {
	if (raw === null || raw === undefined) return {};
	let entries: Array<[string, unknown]>;
	if (Array.isArray(raw)) {
		if (raw.length % 2) throw new Error('invalid_redis_hash');
		entries = [];
		for (let i = 0; i < raw.length; i += 2) {
			if (typeof raw[i] !== 'string') throw new Error('invalid_redis_hash');
			entries.push([raw[i], raw[i + 1]]);
		}
	} else if (typeof raw === 'object') {
		entries = Object.entries(raw);
	} else {
		throw new Error('invalid_redis_hash');
	}
	return Object.fromEntries(entries.map(([key, value]) => {
		if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') {
			throw new Error('invalid_redis_counter');
		}
		const count = Number(value);
		if (!Number.isSafeInteger(count) || count < 0) throw new Error('invalid_redis_counter');
		return [key, count];
	}));
}

/** Validate command envelopes before interpreting null as a missing Redis key. */
export function redisPipelineResults(raw: unknown, expected: number): unknown[] {
	if (!Array.isArray(raw) || raw.length !== expected) throw new Error('invalid_redis_pipeline');
	return raw.map((row) => {
		if (!row || typeof row !== 'object' || Array.isArray(row) ||
			Object.hasOwn(row, 'error') || !Object.hasOwn(row, 'result')) {
			throw new Error('invalid_redis_pipeline');
		}
		return row.result;
	});
}
