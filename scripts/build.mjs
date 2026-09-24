/**
 * Production build: `astro build` followed by the post-build guard.
 *
 * The Astro CLI is spawned as a child process rather than invoked as a shell
 * chain so that Windows-only workarounds can be injected through `--import`
 * (see `scripts/cp-sync-fallback.mjs`). On Linux/macOS — Vercel's builders
 * included — that preload is a no-op.
 *
 * Exit codes are propagated, so CI fails when the guard finds a problem.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const astroBin = path.join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');
const preload = pathToFileURL(path.join(root, 'scripts', 'cp-sync-fallback.mjs')).href;

const run = (args) => spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', env: process.env });

const build = run(['--import', preload, astroBin, 'build']);
if (build.status !== 0) process.exit(build.status ?? 1);

const guard = run([path.join('scripts', 'check-links.mjs')]);
process.exit(guard.status ?? 1);
