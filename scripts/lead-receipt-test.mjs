/** Offline REST-contract tests only. Never connects to Redis or sends email. */
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const dir = await mkdtemp(path.join(tmpdir(), 'paula-lead-receipts-'));
try {
 const outfile = path.join(dir, 'lead-receipts.test.mjs');
 await build({entryPoints: ['tests/lead-receipts.ts'], outfile, bundle: true, platform: 'node', format: 'esm',
  define: {'import.meta.env': JSON.stringify({UPSTASH_REDIS_REST_URL: 'https://redis.example.test', UPSTASH_REDIS_REST_TOKEN: 'fixture-only'})}});
 const noStoreFile = path.join(dir, 'no-store.test.mjs');
 await build({entryPoints: ['tests/lead-receipt-no-store.ts'], outfile: noStoreFile, bundle: true, platform: 'node', format: 'esm',
  define: {'import.meta.env': '{}'}});
 const result = spawnSync(process.execPath, ['--test', outfile, noStoreFile], {stdio: 'inherit'});
 process.exitCode = result.status ?? 1;
} finally {
 await rm(dir, {recursive: true, force: true});
}
