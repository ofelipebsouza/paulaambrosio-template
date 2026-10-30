import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
import { createRequire } from 'node:module';
const { JSDOM } = createRequire(import.meta.url)('jsdom');

const source = await readFile(new URL('../src/pages/admin/index.astro', import.meta.url), 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1];
const compiled = await transform(script + '\nwindow.__crmTest = {refresh, openLead, patchLead, patchTask};', {loader:'ts'});
const fixture = (id) => ({id,name:`Fixture ${id}`,email:`${id}@example.test`,status:'novo',createdAt:Date.now(),notes:[]});
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve; const promise = new Promise(r => {resolve=r;}); return {promise,resolve}; }
function setup() {
 const dom = new JSDOM(`<p id="crm-status-line"></p><span id="crm-board-open"></span><table><tbody id="crm-leads"></tbody></table><div id="crm-leads-cards"></div><p id="crm-leads-foot"></p><div data-dropzone="novo"></div><div data-dropzone="proposta"></div><dialog id="crm-lead-dialog"><button id="crm-dialog-close">Close</button><p id="crm-dialog-name"></p><select id="crm-dialog-status"><option value="novo">New</option><option value="proposta">Proposal</option></select></dialog>`, {url:'https://site.example.test/admin/',runScripts:'outside-only'});
 const {window}=dom;
 window.setInterval=()=>0;
 window.CSS={escape:s=>s};
 const dialog=window.document.querySelector('dialog');
 dialog.showModal=()=>{dialog.open=true;};
 dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new window.Event('close'));};
 let fetchImpl=async path=>{
  assert.ok(String(path).startsWith('/api/crm/'), 'No live network requests');
  if(path==='/api/crm/metrics/')return Response.json({ok:true,metrics:{},storage:{backend:'memory'}});
  if(path.startsWith('/api/crm/leads/?'))return Response.json({ok:true,leads:[fixture('initial')]});
  if(path==='/api/crm/tasks/')return Response.json({ok:true,tasks:[]});
  if(path==='/api/crm/report/')return Response.json({ok:true,report:null});
  throw new Error(`Unexpected fetch ${path}`);
 };
 window.fetch=(...args)=>fetchImpl(...args);
 window.eval(compiled.code);
 return {window,dom,api:window.__crmTest,dialog,setFetch(fn){fetchImpl=fn;}};
}
test('refresh updates table, mobile cards and open count',async()=>{
 const h=setup();try {await tick();
 assert.match(h.window.document.querySelector('#crm-leads').textContent,/Fixture initial/);
 assert.match(h.window.document.querySelector('#crm-leads-cards').textContent,/Fixture initial/);
 assert.equal(h.window.document.querySelector('#crm-board-open').textContent,'1');
 } finally {h.dom.window.close();}
});
test('an older refresh cannot replace newer results',async()=>{
 const h=setup();try {await tick();const old=deferred();let reads=0;
 h.setFetch(async path=>path.startsWith('/api/crm/leads/?') ? (++reads===1 ? old.promise : Response.json({ok:true,leads:[fixture('new')]})) : Response.json({ok:true,metrics:{},tasks:[],report:null}));
 const older=h.api.refresh();await h.api.refresh();old.resolve(Response.json({ok:true,leads:[fixture('old')]}));await older;
 assert.match(h.window.document.querySelector('[data-dropzone="novo"]').textContent,/Fixture new/);
 assert.doesNotMatch(h.window.document.querySelector('[data-dropzone="novo"]').textContent,/Fixture old/);
 } finally {h.dom.window.close();}
});
test('latest selected contact wins and closing cancels pending detail',async()=>{
 const h=setup();try {await tick();const old=deferred();h.setFetch(async path=>path.includes('/old/') ? old.promise : Response.json({ok:true,lead:fixture('new'),events:[]}));
 const older=h.api.openLead('old');await h.api.openLead('new');old.resolve(Response.json({ok:true,lead:fixture('old'),events:[]}));await older;
 assert.equal(h.window.document.querySelector('#crm-dialog-name').textContent,'Fixture new');
 const pending=deferred();h.setFetch(()=>pending.promise);const loading=h.api.openLead('later');
 h.window.document.querySelector('#crm-dialog-close').click();pending.resolve(Response.json({ok:true,lead:fixture('later'),events:[]}));await loading;
 assert.equal(h.dialog.open,false);
 } finally {h.dom.window.close();}
});
test('unconfirmed write is not success and advises reconciliation, not retry',async()=>{
 const h=setup();try {await tick();let writes=0;h.setFetch(async (_path,init)=>{if(init?.method==='PATCH')writes++;return Response.json({ok:false,error:'write_unconfirmed',reconcileBeforeRetry:true},{status:503});});
 assert.equal(await h.api.patchLead('initial',{status:'proposta'}),false);
 assert.equal(writes,1);assert.match(h.window.document.querySelector('#crm-status-line').textContent,/antes de tentar novamente/);
 } finally {h.dom.window.close();}
});
test('failed optimistic move rolls back and repeated saves are not duplicated',async()=>{
 const h=setup();try {await tick();const pending=deferred();let writes=0;
 h.setFetch(async (_path,init)=>{assert.equal(init?.method,'PATCH');writes++;return pending.promise;});
 const card=h.window.document.querySelector('[data-card="initial"]');
 card.dispatchEvent(new h.window.Event('dragstart',{bubbles:true}));
 h.window.document.querySelector('[data-dropzone="proposta"]').dispatchEvent(new h.window.Event('drop',{bubbles:true,cancelable:true}));
 assert.equal(card.parentElement.dataset.dropzone,'proposta');
 assert.equal(await h.api.patchLead('initial',{status:'proposta'}),false);
 assert.equal(writes,1);
 pending.resolve(Response.json({ok:false,error:'write_unconfirmed',reconcileBeforeRetry:true},{status:503}));await tick();
 assert.equal(h.window.document.querySelector('[data-card="initial"]').parentElement.dataset.dropzone,'novo');
 } finally {h.dom.window.close();}
});
test('finishing a status update after closing does not reopen the contact',async()=>{
 const h=setup();try {await tick();
 h.setFetch(async()=>Response.json({ok:true,lead:fixture('initial'),events:[]}));await h.api.openLead('initial');
 const pending=deferred();let detailReads=0;
 h.setFetch(async (path,init)=>{
  if(init?.method==='PATCH')return pending.promise;
  if(path==='/api/crm/leads/initial/') {detailReads++;return Response.json({ok:true,lead:fixture('initial')});}
  return Response.json({ok:true,metrics:{},leads:[fixture('initial')],tasks:[],report:null});
 });
 const select=h.window.document.querySelector('#crm-dialog-status');select.value='proposta';select.dispatchEvent(new h.window.Event('change',{bubbles:true}));
 h.window.document.querySelector('#crm-dialog-close').click();pending.resolve(Response.json({ok:true}));await tick();
 assert.equal(h.dialog.open,false);assert.equal(detailReads,0);
 } finally {h.dom.window.close();}
});
test('read outage retains confirmed contacts and shows stale-data warning',async()=>{
 const h=setup();try {await tick();h.setFetch(async()=>Response.json({ok:false,error:'unavailable'},{status:503}));await h.api.refresh();
 assert.match(h.window.document.querySelector('#crm-leads').textContent,/Fixture initial/);
 assert.match(h.window.document.querySelector('#crm-status-line').textContent,/Atualização incompleta/);
 } finally {h.dom.window.close();}
});
test('rapid repeated detail opens and Escape do not reopen or render stale content',async()=>{
 const h=setup();try {await tick();const pending=deferred();h.setFetch(()=>pending.promise);
 const first=h.api.openLead('one');const second=h.api.openLead('one');
 h.dialog.dispatchEvent(new h.window.Event('cancel'));
 pending.resolve(Response.json({ok:true,lead:fixture('one'),events:[]}));await Promise.all([first,second]);
 assert.equal(h.dialog.open,false);assert.equal(h.window.document.querySelector('#crm-dialog-name').textContent,'');
 } finally {h.dom.window.close();}
});
