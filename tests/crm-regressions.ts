import assert from 'node:assert/strict';
import test from 'node:test';
import { redisHashCounts, redisPipelineResults } from '../src/lib/redis-response';
import { applyLeadPatch } from '../src/lib/crm/lead-actions';
import { completeReplyTasks } from '../src/lib/crm/task-actions';
import { buildLead, type CrmTask } from '../src/lib/crm/schema';
import { dailyCounts, ledgerCounts, getLead, insertLead, saveTask, listTasks } from '../src/lib/crm/store';
import { getAnalyticsSummary } from '../src/lib/analytics/store';
import { scheduleFollowUps } from '../src/lib/crm/automation';
import { ALL as agentRoute } from '../src/pages/api/crm/agent';
import { scoreLead } from '../src/lib/crm/jev';
import { createSessionToken } from '../src/lib/crm/auth';
import { ALL as analyticsRoute } from '../src/pages/api/crm/analytics';
import { ALL as classifyRoute } from '../src/pages/api/crm/jev';
import { ALL as taskRoute } from '../src/pages/api/crm/tasks';
import { ALL as leadRoute } from '../src/pages/api/crm/leads/[id]';

const now = Date.UTC(2026, 9, 6, 15);
function lead(id = 'fixture') {
 return buildLead({id, now, form: 'contact', page: '/contact/', payload: {
 name: 'Fixture', email: 'fixture@example.test', phone: '', location: '', propertyType: '',
 service: '', budget: '', timeline: '', message: 'Fixture only',
 }});
}
function task(id: string, extra: Partial<CrmTask> = {}): CrmTask {
 return {id, leadId:'fixture', leadName:'Fixture', leadEmail:'fixture@example.test', title:'Custom task',
 dueAt:now, state:'open', createdAt:now, completedAt:null, remindedAt:null, ...extra};
}
let classifierFails = false;
let classifyCalls = 0;
const webhookEvents: string[] = [];
let classifier = {score:0.1, temperature:'spam'};
let failRedis = false;
let redisError = false;
let malformedEnvelope = false;
let malformedHash = false;
let hashShape: 'array'|'object' = 'array';
const docs = new Map<string, string>();
const ids = new Set<string>();
const taskIds = new Set<string>();
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
 const url = String(input);
 if (url === 'https://webhook.example.test') {webhookEvents.push(JSON.parse(String(init?.body)).event); return Response.json({ok:true});}
 if (url === 'https://classifier.example.test') {
  classifyCalls++;
  if(classifierFails) return Response.json({error:'fixture failure'},{status:503});
  return Response.json({answers: {score:{noul:classifier.score}, temperature:{choice:classifier.temperature}}});
 }
 assert.equal(url, 'https://redis.example.test/pipeline', 'Tests must never call a live service');
 if (failRedis) throw new Error('fixture outage');
 const cmds = JSON.parse(String(init?.body));
 return Response.json(cmds.map((cmd: Array<string|number>) => {
  if (redisError) return {error:'fixture command failure'};
  if (malformedEnvelope) return {};
  const [op,key,...args] = cmd;
  let result: unknown = null;
  if(op==='SET') {docs.set(String(key),String(args[0])); result='OK';}
  else if(op==='GET') result=docs.get(String(key)) ?? (key==='analytics:views:total' ? '30' : '0');
  else if(op==='ZADD') {if(key==='crm:idx:time') ids.add(String(args[1])); if(key==='crm:idx:tasks') taskIds.add(String(args[1])); result=1;}
  else if(op==='ZREVRANGE') result=key==='crm:idx:time' ? [...ids] : [];
  else if(op==='ZRANGE') result=key==='crm:idx:tasks' ? [...taskIds] : [];
  else if(op==='HGETALL') {
   const hash=String(key).startsWith('crm:metrics:') ? {leads:'3',attempts:'5',accepted:'3'} : {whatsapp_click:'4',phone_click:'2',email_click:'1'};
   result=malformedHash ? ['accepted', 'not-a-number'] : hashShape==='array' ? Object.entries(hash).flat() : hash;
  } else result=1;
  return {result};
 }));
};
process.on('exit', () => {globalThis.fetch=originalFetch;});
function request(path:string, body:unknown, method='POST') {
 return new Request(`https://site.example.test${path}`, {method,headers:{'Content-Type':'application/json',Cookie:`crm_session=${createSessionToken()}`},body:JSON.stringify(body)});
}

test('Redis hash pairs, object, missing and malformed values remain distinct', () => {
 assert.deepEqual(redisHashCounts(['accepted','3','attempts','5']), {accepted:3,attempts:5});
 assert.deepEqual(redisHashCounts({accepted:3,attempts:'5'}), {accepted:3,attempts:5});
 assert.deepEqual(redisHashCounts(null), {});
 assert.deepEqual(redisHashCounts([]), {});
 for(const bad of [['accepted'],['accepted','nope'], {error:'WRONGTYPE'},'bad', ['accepted',-1]]) assert.throws(()=>redisHashCounts(bad));
});
test('status moves including Lost never fabricate a reply; explicit reply is idempotent', () => {
 const item=lead();
 for(const status of ['atendimento_ia','perdido','novo']) {
  const result=applyLeadPatch(item,{status},now+1000);
  assert.equal(result.responded,false); assert.equal(item.firstResponseAt,null);
 }
 const result=applyLeadPatch(item,{responded:true},now+2000);
 assert.equal(result.responded,true); assert.equal(item.firstResponseAt,now+2000);
 assert.equal(applyLeadPatch(item,{responded:true},now+3000).responded,false);
 assert.equal(item.firstResponseAt,now+2000);
});
test('reply completes only same-lead initial tasks, including exact legacy names', () => {
 const tasks=[task('first',{kind:'first_contact'}),task('retry',{kind:'no_reply_reminder',state:'snoozed'}),
 task('legacy',{title:'First contact — reply to Fixture'}),task('legacy-retry',{title:'Second attempt — Fixture has not heard back'}),
 task('manual',{kind:'manual'}),task('unknown'),task('other',{kind:'first_contact',leadId:'other'}),task('done',{kind:'first_contact',state:'done'})];
 const closed=completeReplyTasks(tasks,'fixture',now+1);
 assert.deepEqual(closed.map(t=>t.id),['first','retry','legacy','legacy-retry']);
 assert.ok(closed.every(t=>t.state==='done' && t.completedAt===now+1));
 assert.equal(tasks[0].state,'open','selection must not mutate unrelated input');
});
test('CRM daily/ledger and analytics decode actual raw REST shape and object fixtures', async () => {
 for(const shape of ['array','object'] as const) {
  hashShape=shape;
  assert.ok(Object.values(await dailyCounts(2)).every(n=>n===3));
  assert.ok((await ledgerCounts(2)).every(d=>d.fields.attempts===5 && d.fields.accepted===3 && d.fields.blocked===0));
  assert.deepEqual((await getAnalyticsSummary(2)).topEvents,{whatsapp_click:4,phone_click:2,email_click:1});
 }
});
test('analytics outage and pipeline command error do not masquerade as zero counts', async () => {
 failRedis=true;
 await assert.rejects(getAnalyticsSummary(),/analytics_unavailable/);
 failRedis=false; redisError=true;
 await assert.rejects(getAnalyticsSummary(),/analytics_unavailable/);
 redisError=false;
});
test('scoreLead adds and removes spam flag, preserves other flags and status', async () => {
 const item=lead('scoring'); item.flags=['repeat_submitter'];
 classifier={score:0.1,temperature:'spam'};
 assert.equal(await scoreLead(item,{force:true,now}),true);
 assert.deepEqual(item.flags,['repeat_submitter','jev_spam']); assert.equal(item.status,'novo');
 classifier={score:0.9,temperature:'hot'};
 await scoreLead(item,{force:true,now:now+1});
 assert.deepEqual(item.flags,['repeat_submitter']); assert.equal(item.status,'novo');
});
test('manual classify and backfill use shared flag reconciliation', async () => {
 const item=lead('route-scoring'); await insertLead(item);
 classifier={score:0.1,temperature:'spam'};
 const single=await classifyRoute({request:request('/api/crm/jev/',{action:'classify',id:item.id})} as never);
 assert.equal(single.status,200); assert.ok((await getLead(item.id))?.flags.includes('jev_spam'));
 classifier={score:0.9,temperature:'hot'};
 const backfill=await classifyRoute({request:request('/api/crm/jev/',{action:'backfill',force:true})} as never);
 assert.equal(backfill.status,200); assert.ok(!(await getLead(item.id))?.flags.includes('jev_spam'));
});
test('task completion and Lost API move preserve null reply; explicit reply targets reminders', async () => {
 await insertLead(lead());
 await saveTask(task('custom',{kind:'manual'})); await saveTask(task('automatic',{kind:'first_contact'}));
 const complete=await taskRoute({request:request('/api/crm/tasks/',{id:'custom',state:'done'},'PATCH')} as never);
 assert.equal(complete.status,200); assert.equal((await getLead('fixture'))?.firstResponseAt,null);
 const lost=await leadRoute({request:request('/api/crm/leads/fixture/',{status:'perdido'},'PATCH'),params:{id:'fixture'}} as never);
 assert.equal(lost.status,200); assert.equal((await getLead('fixture'))?.firstResponseAt,null);
 assert.equal((await listTasks()).find(t=>t.id==='automatic')?.state,'open');
 await saveTask(task('custom2',{kind:'manual'}));
 const reply=await leadRoute({request:request('/api/crm/leads/fixture/',{responded:true},'PATCH'),params:{id:'fixture'}} as never);
 assert.equal(reply.status,200); assert.ok((await getLead('fixture'))?.firstResponseAt);
 const tasks=await listTasks(); assert.equal(tasks.find(t=>t.id==='automatic')?.state,'done'); assert.equal(tasks.find(t=>t.id==='custom2')?.state,'open');
});

test('pipeline validation distinguishes missing envelopes from explicit missing keys', () => {
 assert.deepEqual(redisPipelineResults([{result:null}],1),[null]);
 for(const bad of [[],[{}],[null],[{error:'failure'}],{},[{result:0},{result:1}]]) {
  assert.throws(()=>redisPipelineResults(bad,1));
 }
});
test('malformed responses and configured outages never become zero CRM counters or analytics', async () => {
 malformedEnvelope=true;
 await assert.rejects(dailyCounts(),/crm_counters_unavailable/);
 await assert.rejects(ledgerCounts(),/crm_counters_unavailable/);
 await assert.rejects(getAnalyticsSummary(),/analytics_unavailable/);
 malformedEnvelope=false; malformedHash=true;
 await assert.rejects(dailyCounts(),/crm_counters_unavailable/);
 await assert.rejects(ledgerCounts(),/crm_counters_unavailable/);
 malformedHash=false; failRedis=true;
 await assert.rejects(dailyCounts(),/crm_counters_unavailable/);
 const response=await analyticsRoute({request:new Request('https://site.example.test/api/crm/analytics/',{headers:{Cookie:`crm_session=${createSessionToken()}`}})} as never);
 assert.equal(response.status,503); assert.deepEqual(await response.json(),{ok:false,error:'analytics_unavailable'});
 failRedis=false;
});

test('automatic scheduling persists typed first contact and no-reply tasks', async () => {
 const item=lead('scheduled');
 const tasks=await scheduleFollowUps(item,now);
 assert.deepEqual(tasks.map(t=>t.kind),['first_contact','no_reply_reminder']);
 assert.deepEqual(tasks.map(t=>t.dueAt-now),[24*3600000,72*3600000]);
 const stored=await listTasks(); assert.ok(tasks.every(t=>stored.some(s=>s.id===t.id && s.kind===t.kind)));
});
test('combined move/reply emits both events once; repeat does not change timestamp or new tasks', async () => {
 const item=lead('combined'); await insertLead(item); webhookEvents.length=0;
 const invoke=(body:unknown)=>leadRoute({request:request('/api/crm/leads/combined/',body,'PATCH'),params:{id:item.id}} as never);
 assert.equal((await invoke({status:'atendimento_humano',responded:true})).status,200);
 assert.deepEqual(webhookEvents,['lead.status_changed','lead.responded']);
 const timestamp=(await getLead(item.id))?.firstResponseAt;
 await saveTask(task('later',{leadId:item.id,kind:'manual'}));
 await invoke({responded:true}); await invoke({note:'Synthetic note'});
 assert.equal((await getLead(item.id))?.firstResponseAt,timestamp);
 assert.equal((await listTasks()).find(t=>t.id==='later')?.state,'open');
 assert.deepEqual(webhookEvents,['lead.status_changed','lead.responded']);
});
test('Hermes status and response routes share truthful timestamps and task selection', async () => {
 const item=lead('hermes-fixture'); await insertLead(item);
 await saveTask(task('hermes-auto',{leadId:item.id,kind:'first_contact'}));
 await saveTask(task('hermes-manual',{leadId:item.id,kind:'manual'}));
 const invoke=(body:unknown)=>agentRoute({request:new Request('https://site.example.test/api/crm/agent/',{method:'POST',headers:{'Content-Type':'application/json','x-hermes-token':'fixture-only'},body:JSON.stringify(body)})} as never);
 assert.equal((await invoke({leadId:item.id,action:'move',status:'perdido'})).status,200);
 assert.equal((await getLead(item.id))?.firstResponseAt,null);
 assert.equal((await invoke({leadId:item.id,action:'responded'})).status,200);
 const timestamp=(await getLead(item.id))?.firstResponseAt; assert.ok(timestamp);
 await invoke({leadId:item.id,action:'responded'});
 assert.equal((await getLead(item.id))?.firstResponseAt,timestamp);
 const tasks=await listTasks(); assert.equal(tasks.find(t=>t.id==='hermes-auto')?.state,'done'); assert.equal(tasks.find(t=>t.id==='hermes-manual')?.state,'open');
});
test('failed classification preserves score/flags and nonforced backfill skips scored leads', async () => {
 const item=lead('classify-failure'); item.flags=['repeat_submitter']; await insertLead(item);
 classifier={score:0.1,temperature:'spam'};
 await classifyRoute({request:request('/api/crm/jev/',{action:'classify',id:item.id})} as never);
 const before=await getLead(item.id); classifierFails=true;
 const result=await classifyRoute({request:request('/api/crm/jev/',{action:'classify',id:item.id})} as never);
 assert.equal(result.status,502); assert.deepEqual(await getLead(item.id),before); classifierFails=false;
 const countBefore=classifyCalls;
 const unscored=(await Promise.all([...ids].map(id=>getLead(id)))).filter(l=>l && !l.jev).length;
 await classifyRoute({request:request('/api/crm/jev/',{action:'backfill'})} as never);
 assert.equal(classifyCalls-countBefore,unscored);
 assert.deepEqual((await getLead(item.id))?.flags,['repeat_submitter','jev_spam']);
 assert.equal((await getLead(item.id))?.status,'novo');
});
