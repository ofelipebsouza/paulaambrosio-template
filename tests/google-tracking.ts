import assert from 'node:assert/strict';
import test from 'node:test';
import { CONSENT_MAX_AGE, configReady, createTracking, pageContext, parseConsent } from '../src/lib/google-tracking/core';
const config = { enabled: true, containerId: 'GTM-TEST123', reviewedVersion: '1' };
function fixture(overrides = {}) {
 const events: Record<string,unknown>[] = []; const loads: string[] = [];
 const location = {host:'www.paulaambrosio.com',path:'/contact/'};
 let fail = false;
 const engine = createTracking({...config,...overrides},{hostname:()=>location.host,pathname:()=>location.path,now:()=>1000,
 push:x=>events.push(x),loadContainer:id=>{if(fail)throw Error('blocked');loads.push(id);}});
 return {engine,events,loads,location,setFailure:(x:boolean)=>{fail=x;}};
}
test('configuration disabled, placeholder, unaudited, preview and private routes cannot load',()=>{
 for(const overrides of [{enabled:false},{containerId:''},{containerId:'<placeholder>'},{reviewedVersion:''},{reviewedVersion:'0'}]) {
  const x=fixture(overrides);x.engine.consent({analytics:true,advertising:true});assert.equal(x.loads.length,0);
 }
 const x=fixture(); for(const path of ['/admin/','/api/contact/','/style-guides-and-branding/']) {
  x.location.path=path;x.engine.consent({analytics:true,advertising:true});assert.equal(x.loads.length,0);
 }
 assert.equal(configReady(config,'preview.vercel.app'),false);assert.equal(configReady(config,'localhost'),false);
});
test('absent or rejected consent: no container and no preconsent replay',()=>{
 const x=fixture();assert.equal(x.engine.track('form_submit'),false);assert.equal(x.events.length,0);
 x.engine.consent({analytics:false,advertising:false});assert.equal(x.loads.length,0);
 x.engine.consent({analytics:true,advertising:false});assert.equal(x.events.filter(e=>e.event==='paula_form_submit').length,0);
});
test('analytics and ads are separate opt-ins and personalization never granted',()=>{
 for(const analytics of [false,true])for(const advertising of [false,true]) {
  const x=fixture();x.engine.consent({analytics,advertising});
  assert.equal(x.loads.length,analytics||advertising?1:0);
  assert.equal(x.engine.track('service_open'),analytics);
  assert.equal(x.engine.track('whatsapp_click'),advertising);
  assert.ok(x.events.filter(e=>e.event==='paula_consent_update').every(e=>e.paula_ad_personalization==='denied'));
 }
});
test('consent precedes GTM initialization; repeated saves inject only one container',()=>{
 const x=fixture();for(let i=0;i<4;i++)x.engine.consent({analytics:true,advertising:true});
 assert.equal(x.loads.length,1);assert.equal(x.events[0].event,'paula_consent_update');assert.equal(x.events[1].event,'gtm.js');
});
test('first grant can record one page view; repeated settings do not duplicate it',()=>{
 const x=fixture();assert.equal(x.engine.track('page_view'),false);
 x.engine.consent({analytics:true,advertising:false});assert.equal(x.engine.track('page_view'),true);
 x.engine.consent({analytics:true,advertising:false});assert.equal(x.engine.track('page_view'),false);
});
test('withdrawal immediately suppresses site events without any navigation API',()=>{
 const x=fixture();x.engine.consent({analytics:true,advertising:true});
 assert.equal(x.engine.consent({analytics:true,advertising:false}),true);assert.equal(x.engine.needsReload(),true);
 assert.equal(x.engine.track('whatsapp_click'),false);assert.equal(x.engine.track('form_submit'),false);
});
test('generic form success, accepted-like inputs and arbitrary event names never emit',()=>{
 const x=fixture();x.engine.consent({analytics:true,advertising:true});
 for(const event of ['form_success','accepted_form','lead_accepted','conversion','name@example.test','<script>'])assert.equal(x.engine.track(event),false);
});
test('blocked loader is retryable without duplicating GTM initialization',()=>{
 const x=fixture();x.setFailure(true);assert.throws(()=>x.engine.consent({analytics:true,advertising:false}));
 x.setFailure(false);x.engine.consent({analytics:true,advertising:false});assert.equal(x.loads.length,1);
 assert.equal(x.events.filter(e=>e.event==='gtm.js').length,1);
 x.engine.containerFailed();x.engine.consent({analytics:true,advertising:false});assert.equal(x.loads.length,2);
});
test('only public catalog enums cross the dataLayer boundary',()=>{
 const x=fixture();x.location.path='/turnkey-interior-design-miami/?email=secret@example.test#message';
 x.engine.consent({analytics:true,advertising:true});x.engine.track('cta_start_project');
 assert.deepEqual(x.events.at(-1),{event:'paula_cta_start_project',page_section:'service',service_key:'turnkey_interiors'});
 assert.deepEqual(pageContext('/projects/name@example.test/'),{page_section:'projects',service_key:'none'});
 assert.ok(!JSON.stringify(x.events).includes('secret'));
});
test('invalid, future, expired and overbroad saved values cannot become grants',()=>{
 for(const value of [null,'bad','{}','null',JSON.stringify({version:1,analytics:'true',advertising:true,at:999}),JSON.stringify({version:1,analytics:true,advertising:true,at:1001}),JSON.stringify({version:1,analytics:true,advertising:true,at:-CONSENT_MAX_AGE})])assert.equal(parseConsent(value,1000),null);
 assert.deepEqual(parseConsent(JSON.stringify({version:1,analytics:true,advertising:false,at:1000,email:'never retain'}),1000),{version:1,analytics:true,advertising:false,at:1000});
});

// Minimal offline DOM/storage ports. Appending a script records it, never executes it.
const listeners = new Map<string, Array<(event: any)=>void>>();
const storage = new Map<string,string>();
const cookieWrites: string[] = [];
let storageFails = false;
let storageReadFails = false;
let injected: any[] = [];
let navigationCount = 0;
const fakeWindow: any = {addEventListener:(name:string,fn:any)=>listeners.set(name,[...(listeners.get(name)??[]),fn])};
(globalThis as any).window=fakeWindow;
(globalThis as any).location={hostname:'www.paulaambrosio.com',pathname:'/contact/',reload:()=>navigationCount++};
(globalThis as any).localStorage={getItem:(key:string)=>{if(storageReadFails)throw Error('blocked');return storage.get(key)??null;},
 setItem:(key:string,value:string)=>{if(storageFails)throw Error('blocked');storage.set(key,value);},
 removeItem:(key:string)=>{if(storageFails)throw Error('blocked');storage.delete(key);}};
(globalThis as any).document={getElementById:(id:string)=>injected.find(s=>s.id===id),
 createElement:()=>({remove(){injected=injected.filter(s=>s!==this);}}),head:{append:(s:any)=>injected.push(s)},
 get cookie(){return '_ga=fixture; session=untouched';},set cookie(value:string){cookieWrites.push(value);}};
const browser = await import('../src/lib/google-tracking/browser');
function resetBrowser() {
 delete fakeWindow.__paulaGoogle;delete fakeWindow.__paulaGtmReady;delete fakeWindow.dataLayer;storage.clear();cookieWrites.length=0;
 storageFails=false;storageReadFails=false;injected=[];navigationCount=0;
}
test('browser boundary loads once after saved consent and never installs standalone gtag',()=>{
 resetBrowser();browser.restoreConsent();assert.equal(injected.length,0);
 assert.equal(browser.saveConsent({analytics:true,advertising:false}),true);
 assert.equal(injected.length,1);assert.equal(injected[0].src,'https://www.googletagmanager.com/gtm.js?id=GTM-TEST123');
 browser.saveConsent({analytics:true,advertising:false});assert.equal(injected.length,1);
 browser.trackGoogleEvent('form_success');assert.ok(!fakeWindow.dataLayer.some((e:any)=>e.event==='paula_form_success'));
});
test('withdrawal/storage failure never navigates away from an unfinished form',()=>{
 resetBrowser();browser.saveConsent({analytics:true,advertising:true});storageFails=true;
 assert.equal(browser.saveConsent({analytics:false,advertising:false}),false);
 assert.equal(browser.reloadRecommended(),true);assert.equal(navigationCount,0);
 const before=fakeWindow.dataLayer.length;browser.trackGoogleEvent('form_submit');assert.equal(fakeWindow.dataLayer.length,before);
 assert.ok(!cookieWrites.some(s=>s.startsWith('session=')));
 assert.ok(cookieWrites.some(s=>s.startsWith('_ga=')));
});
test('cross-tab rejection and restored-page consent are reconciled',()=>{
 resetBrowser();browser.saveConsent({analytics:true,advertising:true});
 storage.set('paula_optional_consent_v1',JSON.stringify({version:1,at:Date.now(),analytics:false,advertising:false}));
 for(const fn of listeners.get('storage')??[])fn({key:'paula_optional_consent_v1'});
 assert.equal(browser.reloadRecommended(),true);const before=fakeWindow.dataLayer.length;browser.trackGoogleEvent('whatsapp_click');assert.equal(fakeWindow.dataLayer.length,before);
 assert.equal(navigationCount,0);assert.ok(cookieWrites.some(s=>s.startsWith('_ga=')));
 resetBrowser();browser.saveConsent({analytics:true,advertising:false});storage.clear();
 for(const fn of listeners.get('pageshow')??[])fn({persisted:true});assert.equal(browser.reloadRecommended(),true);
});
test('unreadable preferences fail closed and failed async script injection can retry',()=>{
 resetBrowser();storageReadFails=true;browser.restoreConsent();assert.equal(injected.length,0);storageReadFails=false;
 browser.saveConsent({analytics:true,advertising:false});const script=injected[0];script.onerror();assert.equal(injected.length,0);
 browser.saveConsent({analytics:true,advertising:false});assert.equal(injected.length,1);
});

test('duplicate handlers for one WhatsApp click produce one Google event',async()=>{
 resetBrowser();browser.saveConsent({analytics:false,advertising:true});
 browser.trackGoogleEvent('whatsapp_click');browser.trackGoogleEvent('whatsapp_click');
 assert.equal(fakeWindow.dataLayer.filter((e:any)=>e.event==='paula_whatsapp_click').length,1);
 await Promise.resolve();browser.trackGoogleEvent('whatsapp_click');
 assert.equal(fakeWindow.dataLayer.filter((e:any)=>e.event==='paula_whatsapp_click').length,2);
});

test('withdrawal during a delayed GTM download removes the pending script and queued grants',()=>{
 resetBrowser();browser.saveConsent({analytics:true,advertising:true});browser.trackGoogleEvent('cta_contact');
 assert.equal(injected.length,1);browser.saveConsent({analytics:false,advertising:false});
 assert.equal(injected.length,0);assert.equal(navigationCount,0);
 assert.deepEqual(fakeWindow.dataLayer,[{event:'paula_consent_update',paula_analytics_consent:'denied',paula_advertising_consent:'denied',paula_ad_personalization:'denied'}]);
});

test('successful preference persistence is not misreported when optional script insertion throws',()=>{
 resetBrowser();const original=(globalThis as any).document.head.append;
 (globalThis as any).document.head.append=()=>{throw Error('script blocked');};
 assert.equal(browser.saveConsent({analytics:true,advertising:false}),true);
 assert.equal(browser.savedConsent()?.analytics,true);
 (globalThis as any).document.head.append=original;
 browser.trackGoogleEvent('service_open');assert.equal(injected.length,1);
});

test('ready follows consent update so base tags cannot race the consent APIs',()=>{
 const x=fixture();x.engine.consent({analytics:true,advertising:false});
 assert.deepEqual(x.events.slice(0,3).map(e=>e.event),['paula_consent_update','gtm.js','paula_consent_ready']);
 x.engine.consent({analytics:true,advertising:true});
 assert.deepEqual(x.events.slice(-2).map(e=>e.event),['paula_consent_update','paula_consent_ready']);
 x.engine.consent({analytics:false,advertising:false});
 assert.equal(x.events.at(-1)?.event,'paula_consent_update');
});

test('reviewed consent-template source sets defaults once and never grants personalization',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile('docs/gtm-consent-template.js','utf8');
 const defaults:unknown[]=[];const updates:any[]=[];const values=new Map<string,unknown>();const memory=new Map<string,unknown>();
 const apis:Record<string,unknown>={
  setDefaultConsentState:(x:unknown)=>defaults.push(x),updateConsentState:(x:unknown)=>updates.push(x),
  copyFromDataLayer:(key:string)=>{assert.ok(['paula_analytics_consent','paula_advertising_consent'].includes(key));return values.get(key);},
  templateStorage:{getItem:(key:string)=>memory.get(key),setItem:(key:string,value:unknown)=>memory.set(key,value)},
 };
 const run=new Function('require','data',source);
 const requireApi=(key:string)=>{assert.ok(Object.hasOwn(apis,key));return apis[key];};
 run(requireApi,{gtmOnSuccess:()=>{}});
 values.set('paula_analytics_consent','granted');values.set('paula_advertising_consent','denied');run(requireApi,{gtmOnSuccess:()=>{}});
 values.set('paula_advertising_consent','granted');run(requireApi,{gtmOnSuccess:()=>{}});
 assert.equal(defaults.length,1);assert.equal(updates.length,3);
 assert.equal(updates[0].analytics_storage,'denied');assert.equal(updates[1].analytics_storage,'granted');
 assert.equal(updates[1].ad_storage,'denied');assert.equal(updates[2].ad_storage,'granted');
 assert.ok(updates.every(x=>x.ad_personalization==='denied'));
});
