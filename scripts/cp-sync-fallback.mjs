/**
 * Windows + OneDrive fallback for `fs.cpSync`.
 *
 * `@astrojs/vercel` copies its build output with the synchronous `fs.cpSync`.
 * Inside a OneDrive-synced checkout on Windows that call fails with
 * `EIO, Acesso negado` for every path in the tree, while `copyFileSync`,
 * `mkdirSync`, `readdirSync` and the async `fs.promises.cp` work normally — so
 * the production build dies in the adapter's `astro:build:done` hook on a
 * machine where it should work.
 *
 * Loaded through `--import` by `scripts/build.mjs`. Outside Windows nothing
 * changes: the native implementation is tried first and is the only one used.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const fs = require('node:fs');

const toPath = (value) => (value instanceof URL ? fileURLToPath(value) : String(value));

/** Copy a tree with the primitives that keep working under OneDrive. */
function copyWithPrimitives(source, target) {
	const from = toPath(source);
	const to = toPath(target);
	const stats = fs.statSync(from);

	if (stats.isDirectory()) {
		fs.mkdirSync(to, { recursive: true });
		for (const entry of fs.readdirSync(from)) {
			copyWithPrimitives(join(from, entry), join(to, entry));
		}
		return;
	}

	fs.copyFileSync(from, to);
}

if (process.platform === 'win32') {
	const native = fs.cpSync;

	const cpSync = function cpSync(source, target, options) {
		try {
			return native.call(fs, source, target, options);
		} catch (error) {
			// Only the OneDrive/Windows I-O failure is worth retrying; anything
			// else (ENOENT, EEXIST, permissions) must surface unchanged.
			if (error?.code !== 'EIO' && error?.code !== 'EPERM') throw error;
			process.stderr.write(
				`[build] fs.cpSync falhou (${error.code}) — usando cópia alternativa para ${toPath(target)}\n`,
			);
			return copyWithPrimitives(source, target);
		}
	};

	Object.defineProperty(fs, 'cpSync', { value: cpSync, writable: true, configurable: true });
}
