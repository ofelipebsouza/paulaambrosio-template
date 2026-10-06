import { GOOGLE_TRACKING } from './config';
import { CONSENT_KEY, createTracking, parseConsent, type ConsentChoice, type SavedConsent } from './core';

type TrackingWindow = Window & { dataLayer?: Array<Record<string, unknown>>; __paulaGoogle?: ReturnType<typeof createTracking>; __paulaGtmReady?: boolean };
function runtime() {
 if (typeof window === 'undefined') return null;
 const w = window as TrackingWindow;
 if (!w.__paulaGoogle) w.__paulaGoogle = createTracking(GOOGLE_TRACKING, {
  hostname: () => location.hostname,
  pathname: () => location.pathname,
  now: () => Date.now(),
  push: (value) => { (w.dataLayer ??= []).push(value); },
  loadContainer: (id) => {
   if (document.getElementById('paula-google-container')) return;
   const script = document.createElement('script');
   script.id = 'paula-google-container'; script.async = true;
   // Never include page paths, queries or fragments in the cross-origin loader referrer.
   script.referrerPolicy = 'origin';
   script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
   w.__paulaGtmReady = false;
   script.onload = () => { w.__paulaGtmReady = true; };
   script.onerror = () => { script.remove(); w.__paulaGoogle?.containerFailed(); };
   document.head.append(script);
  },
 });
 return w.__paulaGoogle;
}
export function savedConsent(): SavedConsent | null {
 try { return parseConsent(localStorage.getItem(CONSENT_KEY), Date.now()); } catch { return null; }
}
export function trackingAvailable(): boolean { return runtime()?.ready() ?? false; }
export function reloadRecommended(): boolean { return runtime()?.needsReload() ?? false; }
export function restoreConsent(): void {
 try { const choice = savedConsent(); if (choice) runtime()?.consent(choice); } catch { /* Form UX never depends on tracking. */ }
}
export function saveConsent(choice: ConsentChoice): boolean {
 try {
  // Preferences only: never contact fields, ad identifiers, or event history.
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: 1, at: Date.now(), ...choice }));
 } catch {
  // Never claim persistence succeeded. Remove an old grant if storage permits it.
  try { localStorage.removeItem(CONSENT_KEY); } catch { /* UI reports the failure. */ }
  try { if (runtime()?.consent({ analytics: false, advertising: false })) clearGoogleCookies(); } catch { /* fail closed */ }
  return false;
 }
 try {
  if (runtime()?.consent(choice)) clearGoogleCookies();
  return true;
 } catch {
  // Preferences were saved. Optional loader failures must not misreport that choice.
  return true;
 }
}
const sameTurnEvents = new Set<string>();
export function trackGoogleEvent(event: string): void {
 try {
  const choice = savedConsent();
  if (!choice) { if (runtime()?.consent({ analytics: false, advertising: false })) clearGoogleCookies(); return; }
  if (runtime()?.consent(choice)) clearGoogleCookies();
  if (sameTurnEvents.has(event)) return;
  if (runtime()?.track(event)) {
   sameTurnEvents.add(event);
   queueMicrotask(() => sameTurnEvents.delete(event));
  }
 } catch { /* No navigation or form failures from measurement. */ }
}

/** Clear only first-party Google measurement cookies when consent is withdrawn. */
function clearGoogleCookies(): void {
 const w = window as TrackingWindow;
 if (!w.__paulaGtmReady) {
  // If consent is withdrawn while GTM is downloading, never replay old grants/events.
  document.getElementById('paula-google-container')?.remove();
  if (w.dataLayer) {
   w.dataLayer.splice(0, w.dataLayer.length);
   w.dataLayer.push({ event: 'paula_consent_update', paula_analytics_consent: 'denied', paula_advertising_consent: 'denied', paula_ad_personalization: 'denied' });
  }
 }
 for (const cookie of document.cookie.split(';')) {
  const name = cookie.trim().split('=', 1)[0];
  if (!/^(_ga(?:_|$)|_gcl_|_gac_)/.test(name)) continue;
  for (const domain of ['', '; Domain=paulaambrosio.com', '; Domain=www.paulaambrosio.com']) {
   document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax; Secure`;
  }
 }
}
function reconcileConsent() {
 try {
  const choice = savedConsent() ?? { analytics: false, advertising: false };
  if (runtime()?.consent(choice)) clearGoogleCookies();
 } catch { /* No page business flow depends on storage synchronization. */ }
}
if (typeof window !== 'undefined') {
 window.addEventListener('storage', (event) => {
  if (event.key === CONSENT_KEY || event.key === null) reconcileConsent();
 });
 window.addEventListener('pageshow', reconcileConsent);
}
