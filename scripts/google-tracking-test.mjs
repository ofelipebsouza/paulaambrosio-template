/** Offline tests only; no Google code or live conversion is loaded. */
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const dir=await mkdtemp(path.join(tmpdir(),'paula-tracking-tests-'));
try {
 const outfile=path.join(dir,'tracking.test.mjs');
 await build({entryPoints:['tests/google-tracking.ts'],outfile,bundle:true,platform:'node',format:'esm',define:{'import.meta.env':JSON.stringify({PUBLIC_GOOGLE_TRACKING_ENABLED:'true',PUBLIC_GTM_CONTAINER_ID:'GTM-TEST123',PUBLIC_GTM_REVIEWED_VERSION:'1'})}});
 process.exitCode=spawnSync(process.execPath,['--test',outfile],{stdio:'inherit'}).status ?? 1;
} finally {await rm(dir,{recursive:true,force:true});}
