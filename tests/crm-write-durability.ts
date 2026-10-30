import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionToken } from '../src/lib/crm/auth';
import { buildLead, type CrmTask } from '../src/lib/crm/schema';
import { CrmWriteUnconfirmedError, getLead, getReport, listLeads, listTasks, pushEvent, saveLead, saveTask, saveReport } from '../src/lib/crm/store';
import { ALL as leadRoute } from '../src/pages/api/crm/leads/[id]';
import { ALL as taskRoute } from '../src/pages/api/crm/tasks';
import { ALL as reportRoute } from '../src/pages/api/crm/report';

const memory = Boolean(import.meta.env.TEST_MEMORY_ONLY);
const db = new Map<string, string>();
const tasks = new Set<string>();
let writeMode: 'ok'|'fail'|'ambiguous'|'malformed' = 'ok';
let readFailure: ''|'lead'|'index'|'task' = '';
let writeCalls = 0;
let webhookCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
 assert.ok(!memory, 'Memory fixtures must not use the network');
 if (String(url) === 'https://webhook.example.test') { webhookCalls++; return Response.json({ok:true}); }
 assert.equal(String(url), 'https://redis.example.test/pipeline', 'Live services are forbidden');
 const commands = JSON.parse(String(init?.body)) as Array<Array<string|number>>;
 if(commands.some(([op,key]) => (readFailure==='lead' && op==='GET' && String(key).startsWith('crm:lead:')) || (readFailure==='index' && op==='ZRANGE') || (readFailure==='task' && op==='GET' && String(key).startsWith('crm:task:')))) throw new Error('synthetic read outage');
 const writes = commands.some(([op])=>op==='SET'||op==='ZADD');
 if(writes) writeCalls++;
 if(writes && writeMode==='fail') throw new Error('synthetic outage');
 if(writes && writeMode==='malformed') return Response.json([{}]);
 const results = commands.map(([op,key,...args])=>{
  let result:unknown = null;
  if(op==='GET') result=db.get(String(key))??null;
  if(op==='SET') {db.set(String(key),String(args[0])); result='OK';}
  if(op==='ZADD') {if(key==='crm:idx:tasks') tasks.add(String(args[1])); result=1;}
  if(op==='ZRANGE') result=key==='crm:idx:tasks'?[...tasks]:[];
  if(op==='ZREVRANGE') result=[];
  return {result};
 });
 if(writes && writeMode==='ambiguous') throw new Error('synthetic response lost after commit');
 return Response.json(results);
};
process.on('exit',()=>{globalThis.fetch=originalFetch;});
const makeLead=(id:string)=>buildLead({id,now:Date.UTC(2026,9,30),form:'contact',page:'/contact/',payload:{name:'Fixture',email:'fixture@example.test',phone:'',location:'',propertyType:'',service:'',budget:'',timeline:'',message:'Synthetic fixture only'}});
const makeTask=(id:string):CrmTask=>({id,leadId:'fixture',leadName:'Fixture',leadEmail:'fixture@example.test',title:'Manual fixture',kind:'manual',dueAt:1,state:'open',createdAt:1,completedAt:null,remindedAt:null});
const request=(path:string,body:unknown,method='PATCH')=>new Request('https://site.example.test'+path,{method,headers:{Cookie:`crm_session=${createSessionToken()}`,'Content-Type':'application/json','x-hermes-token':'fixture-only'},body:JSON.stringify(body)});
const assertReadUnavailable=async(response:Response)=>{assert.equal(response.status,503);assert.deepEqual(await response.json(),{ok:false,error:'read_unavailable'});};
const assertUnconfirmed=async(response:Response)=>{assert.equal(response.status,503);assert.deepEqual(await response.json(),{ok:false,error:'write_unconfirmed',reconcileBeforeRetry:true});};

if(memory){
 test('Explicit development memory mode preserves manual lead/task/report writes',async()=>{
  await saveLead(makeLead('fixture'),{requireDurable:true});await saveTask(makeTask('task'),{requireDurable:true});
  assert.equal((await leadRoute({request:request('/api/crm/leads/fixture/',{status:'fechado'}),params:{id:'fixture'}} as never)).status,200);
  assert.equal((await getLead('fixture'))?.status,'fechado');
  assert.equal((await taskRoute({request:request('/api/crm/tasks/',{id:'task',state:'done'})} as never)).status,200);
  assert.equal((await listTasks())[0].state,'done');
  assert.equal((await reportRoute({request:request('/api/crm/report/',{summary:'Synthetic'},'POST')} as never)).status,200);
  assert.equal((await getReport())?.summary,'Synthetic');
 });
}else{
 test('Strict writes reject configured outages and malformed envelopes; no implicit retry',async()=>{
  for(const mode of ['fail','malformed'] as const){
   writeMode=mode;
   for(const operation of [()=>saveLead(makeLead('strict'),{requireDurable:true}),()=>saveTask(makeTask('strict'),{requireDurable:true}),()=>saveReport({generatedAt:1,summary:'Synthetic',highlights:[],actions:[]},{requireDurable:true}),()=>pushEvent('strict',{ts:1,type:'note',detail:'Synthetic',actor:'studio'},{requireDurable:true})]){
    const before=writeCalls;await assert.rejects(operation,CrmWriteUnconfirmedError);assert.equal(writeCalls,before+1);
   }
  }
  writeMode='ok';
 });
 test('Manual lead edit returns 503 without emitting a webhook or claiming persistence',async()=>{
  await saveLead(makeLead('fixture'));writeMode='fail';const before=webhookCalls;
  await assertUnconfirmed(await leadRoute({request:request('/api/crm/leads/fixture/',{status:'fechado'}),params:{id:'fixture'}} as never));
  assert.equal(webhookCalls,before);writeMode='ok';assert.equal((await getLead('fixture'))?.status,'novo');
 });
 test('Manual task and Hermes report return explicit unconfirmed-write responses',async()=>{
  await saveTask(makeTask('task'));writeMode='fail';
  await assertUnconfirmed(await taskRoute({request:request('/api/crm/tasks/',{id:'task',state:'done'})} as never));
  await assertUnconfirmed(await reportRoute({request:request('/api/crm/report/',{summary:'Synthetic'},'POST')} as never));
  writeMode='ok';assert.equal((await listTasks())[0].state,'open');assert.equal(await getReport(),null);
 });
 test('Lost response after commit is reported uncertain, never retried or announced by webhook',async()=>{
  writeMode='ambiguous';const before=writeCalls;const webhooks=webhookCalls;
  await assertUnconfirmed(await leadRoute({request:request('/api/crm/leads/fixture/',{status:'fechado'}),params:{id:'fixture'}} as never));
  assert.equal(writeCalls,before+1);assert.equal(webhookCalls,webhooks);
  writeMode='ok';assert.equal((await getLead('fixture'))?.status,'fechado');
 });
 test('Failed strict write cannot mutate a fallback record through a shared reference',async()=>{
  writeMode='fail';await saveLead(makeLead('memory-copy'));await saveTask(makeTask('memory-task'));
  const priorFetch=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('synthetic full outage');};
  try{
   await assertReadUnavailable(await leadRoute({request:request('/api/crm/leads/memory-copy/',{status:'fechado'}),params:{id:'memory-copy'}} as never));
   assert.equal((await getLead('memory-copy'))?.status,'novo');
   await assertReadUnavailable(await taskRoute({request:request('/api/crm/tasks/',{id:'memory-task',state:'done'})} as never));
   assert.equal((await listTasks()).find(t=>t.id==='memory-task')?.state,'open');
  }finally{globalThis.fetch=priorFetch;writeMode='ok';}
 });
 test('Unavailable lead reads return 503 rather than a false 404 or stale edit',async()=>{
  readFailure='lead';const before=writeCalls;
  try {
   await assertReadUnavailable(await leadRoute({request:request('/api/crm/leads/fixture/',{status:'novo'}),params:{id:'fixture'}} as never));
   assert.equal(writeCalls,before);
  }finally{readFailure='';}
 });
 test('Task index and document outages return 503 and never persist first response',async()=>{
  for(const failure of ['index','task'] as const){
   readFailure=failure;const before=writeCalls;
   try{
    await assertReadUnavailable(await taskRoute({request:request('/api/crm/tasks/',{id:'task',state:'done'})} as never));
    await assertReadUnavailable(await taskRoute({request:new Request('https://site.example.test/api/crm/tasks/',{headers:{Cookie:`crm_session=${createSessionToken()}`}})} as never));
    await assertReadUnavailable(await leadRoute({request:request('/api/crm/leads/fixture/',{responded:true}),params:{id:'fixture'}} as never));
    assert.equal(writeCalls,before);
    assert.equal((await getLead('fixture'))?.firstResponseAt,null);
   }finally{readFailure='';}
  }
 });
 test('A healthy empty Redis lead index never mixes fallback records into the result',async()=>{
  writeMode='fail';await saveLead(makeLead('fallback-only'));writeMode='ok';
  assert.deepEqual(await listLeads(),{leads:[],total:0});
 });

}
