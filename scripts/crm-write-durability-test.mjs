/** Offline fixtures only: all service requests are deny-by-default mocked. */
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const dir = await mkdtemp(path.join(tmpdir(), 'paula-crm-durability-'));
try {
 for (const memory of [false, true]) {
  const env = {CRM_PASSWORD:'fixture-only',CRM_SESSION_SECRET:'fixture-only',HERMES_TOKEN:'fixture-only',...(memory?{TEST_MEMORY_ONLY:true}:{UPSTASH_REDIS_REST_URL:'https://redis.example.test',UPSTASH_REDIS_REST_TOKEN:'fixture-only',JEV_WEBHOOK_URL:'https://webhook.example.test'})};
  const outfile=path.join(dir,`durability-${memory}.mjs`);
  await build({entryPoints:['tests/crm-write-durability.ts'],outfile,bundle:true,platform:'node',format:'esm',define:{'import.meta.env':JSON.stringify(env)}});
  const result=spawnSync(process.execPath,['--test',outfile],{stdio:'inherit'});
  if(result.status!==0){process.exitCode=result.status??1;break;}
 }
}finally{await rm(dir,{recursive:true,force:true});}
