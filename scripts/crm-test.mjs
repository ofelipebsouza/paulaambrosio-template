/** Offline regression suite: synthetic data and a deny-by-default fetch mock only. */
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const dir=await mkdtemp(path.join(tmpdir(),'paula-crm-tests-'));
try {
 const outfile=path.join(dir,'crm.test.mjs');
 await build({entryPoints:['tests/crm-regressions.ts'],outfile,bundle:true,platform:'node',format:'esm',
  define:{'import.meta.env':JSON.stringify({UPSTASH_REDIS_REST_URL:'https://redis.example.test',UPSTASH_REDIS_REST_TOKEN:'fixture-only',TYPESAFE_API_KEY:'fixture-only',JEV_API_URL:'https://classifier.example.test',JEV_WEBHOOK_URL:'https://webhook.example.test',HERMES_TOKEN:'fixture-only',CRM_PASSWORD:'fixture-only',CRM_SESSION_SECRET:'fixture-only'})}});
 const result=spawnSync(process.execPath,['--test',outfile],{stdio:'inherit'});
 process.exitCode=result.status ?? 1;
} finally {await rm(dir,{recursive:true,force:true});}
