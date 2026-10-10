/** Offline only: real boundary code in an isolated fake browser; no network or lead creation. */
import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const { outputFiles } = await build({
 entryPoints: [new URL('../src/lib/google-tracking/browser.ts', import.meta.url).pathname],
 bundle: true, write: false, format: 'cjs', target: 'es2022',
 define: { 'import.meta.env.PUBLIC_GOOGLE_TRACKING_ENABLED': JSON.stringify('true'),
  'import.meta.env.PUBLIC_OPENAI_PIXEL_ENABLED': JSON.stringify('false') },
});
const source = outputFiles[0].text;
const receipt = {version:1,eventId:'934b02bd-40fb-4ff1-836f-8f2f390c1077'};
function fixture({analytics=false, advertising=null, hostname='www.paulaambrosio.com',pathname='/contact/',session=new Map(),readFail=false,writeFail=false}={}) {
 let now=1802000000000;
 let raw=advertising===null?null:JSON.stringify({version:1,at:now,analytics,advertising});
 const listeners=new Map(), scripts=new Map(), loads=[];
 const fire=(name,data={})=>(listeners.get(name)??[]).forEach(fn=>fn(data));
 const window={addEventListener(name,fn){listeners.set(name,[...(listeners.get(name)??[]),fn]);},dispatchEvent(e){fire(e.type,e);}};
 const context={window,location:{hostname,pathname},Date:{now:()=>now},queueMicrotask(){},Event:class{constructor(type){this.type=type;}},
 localStorage:{getItem(){if(readFail)throw Error('blocked');return raw;},setItem(k,v){if(writeFail)throw Error('blocked');raw=v;},removeItem(){if(writeFail)throw Error('blocked');raw=null;}},
 sessionStorage:{getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)},
 document:{getElementById:id=>scripts.get(id),createElement(){return {remove(){scripts.delete(this.id);}};},head:{append(s){scripts.set(s.id,s);loads.push(s);}},cookie:''}};
 context.module = { exports: {} }; context.exports = context.module.exports;
 vm.runInNewContext(source,context); context.api = context.module.exports;
 return {api:context.api,window,loads,scripts,fire,context,session,
 choice(a,b){raw=JSON.stringify({version:1,at:now,analytics:a,advertising:b});},expire(){now+=91*86400000;},failRead(){readFail=true;},failWrite(){writeFail=true;},
 events:()=>JSON.parse(JSON.stringify((window.dataLayer??[]).filter(x=>x.event==='paula_lead_accepted')))};
}
test('accepted receipt emits minimal payload once, advertising-only consent is sufficient',()=>{
 const x=fixture({advertising:true});
 assert.equal(x.api.measureGoogleAcceptedLead({...receipt,email:'private@example.test',budget:'secret',message:'private'}),true);
 assert.deepEqual(x.events(),[{event:'paula_lead_accepted',transaction_id:receipt.eventId,page_section:'contact',service_key:'none'}]);
 assert.equal(x.loads.length,1);
 assert.equal(x.api.measureGoogleAcceptedLead(receipt),false);
 assert.deepEqual(x.window.dataLayer.slice(0,3).map(e=>e.event).join(','),'paula_consent_update,gtm.js,paula_consent_ready');
});
test('HTTP 200, attempts, pageviews, generic success, malformed and absent receipts never convert',()=>{
 const x=fixture({analytics:true,advertising:true});x.api.restoreConsent();
 for(const value of [null,{},true,{ok:true},{event:'form_success'},{eventId:receipt.eventId},{version:2,eventId:receipt.eventId},{version:1,eventId:'private@example.test'}]) assert.equal(x.api.measureGoogleAcceptedLead(value),false);
 for(const event of ['page_view','form_submit','form_success','accepted_form','lead_accepted']) x.api.trackGoogleEvent(event);
 assert.equal(x.events().length,0);
});
test('no consent, rejected and analytics-only consent cannot convert or replay after later grant',()=>{
 for(const advertising of [null,false]) {
 const x=fixture({analytics:true,advertising});assert.equal(x.api.measureGoogleAcceptedLead(receipt),false);
 x.api.saveConsent({analytics:true,advertising:true});assert.equal(x.events().length,0);
 }
});
test('private, apex and preview routes cannot emit',()=>{
 for(const options of [{hostname:'preview.vercel.app'},{hostname:'localhost'},{hostname:'paulaambrosio.com'},...['/admin/','/api/contact/','/style-guides-and-branding/'].map(pathname=>({pathname}))]) {
 const x=fixture({advertising:true,...options});assert.equal(x.api.measureGoogleAcceptedLead(receipt),false);assert.equal(x.loads.length,0);
 }
});
test('consent withdrawal, expiry and read failure reject receipts at response time',()=>{
 for(const mode of ['withdraw','expire','read']) {
 const x=fixture({advertising:true});x.api.restoreConsent();
 if(mode==='withdraw')x.choice(false,false);if(mode==='expire')x.expire();if(mode==='read')x.failRead();
 assert.equal(x.api.measureGoogleAcceptedLead(receipt),false);assert.equal(x.events().length,0);
 }
});
test('failed consent persistence cannot use a stale readable grant',()=>{
 const x=fixture({advertising:true});x.failWrite();assert.equal(x.api.saveConsent({analytics:false,advertising:false}),false);
 assert.equal(x.api.measureGoogleAcceptedLead(receipt),false);assert.equal(x.events().length,0);
});
test('withdrawal while container downloads discards queued receipt and stale grants',()=>{
 const x=fixture({advertising:true});x.api.measureGoogleAcceptedLead(receipt);assert.equal(x.events().length,1);
 x.api.saveConsent({analytics:false,advertising:false});assert.equal(x.events().length,0);assert.equal(x.scripts.size,0);
 assert.equal(x.session.has('paula_google_measured_v1'),false);
 x.api.saveConsent({analytics:false,advertising:true});assert.equal(x.api.measureGoogleAcceptedLead(receipt),false);
});
test('session IDs deduplicate after reload; no form data are retained',()=>{
 const session=new Map();const x=fixture({advertising:true,session});x.api.measureGoogleAcceptedLead(receipt);
 assert.deepEqual(JSON.parse(session.get('paula_google_measured_v1')),[receipt.eventId]);
 const y=fixture({advertising:true,session});assert.equal(y.api.measureGoogleAcceptedLead(receipt),false);assert.equal(y.events().length,0);
});
test('throwing loader or dataLayer cannot affect business flow',()=>{
 const x=fixture({advertising:true});x.context.document.head.append=()=>{throw Error('blocked');};
 assert.equal(x.api.measureGoogleAcceptedLead(receipt),false);
 const y=fixture({advertising:true});y.api.restoreConsent();y.window.dataLayer.push=()=>{throw Error('blocked');};
 assert.equal(y.api.measureGoogleAcceptedLead(receipt),false);
});
test('form calls independent vendors only within accepted-response branch',()=>{
 const form=read('../src/components/Analytics.astro');
 assert.match(form,/if \(\[200, 502, 503\]\.includes\(response.status\) && result\?\.leadAcceptance\) \{\s*measureAcceptedLead\(result.leadAcceptance\);\s*measureGoogleAcceptedLead\(result.leadAcceptance\);\s*\}/);
 assert.equal((form.match(/measureGoogleAcceptedLead\(result.leadAcceptance\)/g)??[]).length,1);
});

test('initial denial clears old opaque receipt history without loading Google',()=>{
 for(const advertising of [null,false]) {
  const session=new Map([['paula_google_measured_v1',JSON.stringify([receipt.eventId])]]);
  const x=fixture({advertising,session});x.api.restoreConsent();
  assert.equal(session.size,0);assert.equal(x.loads.length,0);
 }
});
test('session storage failure retains in-document receipt deduplication',()=>{
 const x=fixture({advertising:true});
 x.context.sessionStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
 assert.equal(x.api.measureGoogleAcceptedLead(receipt),true);
 assert.equal(x.api.measureGoogleAcceptedLead(receipt),false);
 assert.equal(x.events().length,1);
});
