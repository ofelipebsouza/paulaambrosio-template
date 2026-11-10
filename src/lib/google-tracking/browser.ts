import { openAIPixelAvailable, openAIPixelNeedsReload } from '../openai-pixel/browser';
import { metaPixelAvailable, metaPixelNeedsReload } from '../meta-pixel/browser';
import { GOOGLE_TRACKING } from './config';
import { isLeadAcceptance, isSubmissionId } from '../lead-acceptance';
import { CONSENT_KEY, createTracking, parseConsent, type ConsentChoice, type ConsentModeState, type SavedConsent } from './core';

type TrackingWindow = Window & { dataLayer?: Array<Record<string, unknown>>; gtag?: (...args: unknown[]) => void; __paulaGoogle?: ReturnType<typeof createTracking>; __paulaGoogleConsentFailed?: boolean };
const ACCEPTED_KEY = 'paula_google_measured_v1';
function clearAcceptedHistory(): void {
 try { sessionStorage.removeItem(ACCEPTED_KEY); } catch { /* Consent gates remain authoritative. */ }
}
function runtime() {
 if (typeof window === 'undefined') return null;
 const w = window as TrackingWindow;
 if (!w.__paulaGoogle) w.__paulaGoogle = createTracking(GOOGLE_TRACKING, {
  hostname: () => location.hostname,
  pathname: () => location.pathname,
  now: () => Date.now(),
  push: (value) => { (w.dataLayer ??= []).push(value); },
  updateConsent: (state) => applyConsentUpdate(w, state),
 });
 return w.__paulaGoogle;
}
export function savedConsent(): SavedConsent | null {
 try { return parseConsent(localStorage.getItem(CONSENT_KEY), Date.now()); } catch { return null; }
}
export function trackingAvailable(): boolean { return (runtime()?.ready() ?? false) || openAIPixelAvailable() || metaPixelAvailable(); }
export function reloadRecommended(): boolean { return (runtime()?.needsReload() ?? false) || openAIPixelNeedsReload() || metaPixelNeedsReload(); }
export function restoreConsent(): void {
 try {
  const choice = savedConsent();
  if (!choice?.advertising) clearAcceptedHistory();
  if (!choice) return;
  const engine = runtime();
  engine?.consent(choice);
  // A stored rejection never enters the grant path. The head snippet updates first;
  // this repeats the command for a document whose inline script did not run.
  if (!choice.analytics && !choice.advertising) engine?.publishConsent();
 } catch { /* Form UX never depends on tracking. */ }
}
function notifyConsentChange(denied = false): void {
 try { window.dispatchEvent(new Event(denied ? 'paula:consent-denied' : 'paula:consent-change')); } catch { /* Optional listeners must never change preference persistence. */ }
}
export function saveConsent(choice: ConsentChoice): boolean {
 if (!choice.advertising) clearAcceptedHistory();
 try {
  // Preferences only: never contact fields, ad identifiers, or event history.
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: 1, at: Date.now(), ...choice }));
 } catch {
  // Never claim persistence succeeded. Remove an old grant if storage permits it.
  (window as TrackingWindow).__paulaGoogleConsentFailed = true;
  try { localStorage.removeItem(CONSENT_KEY); } catch { /* UI reports the failure. */ }
  try { if (runtime()?.consent({ analytics: false, advertising: false })) clearGoogleCookies(); } catch { /* fail closed */ }
  notifyConsentChange(true);
  return false;
 }
 notifyConsentChange();
 try {
  const engine = runtime();
  if (engine?.consent(choice)) clearGoogleCookies();
  else if (!choice.analytics && !choice.advertising) engine?.publishConsent();
  return true;
 } catch {
  // Preferences were saved. Optional loader failures must not misreport that choice.
  return true;
 }
}
const sameTurnEvents = new Set<string>();
/** Separate from generic form events; no contact fields or raw URLs are forwarded. */
export function measureGoogleAcceptedLead(value: unknown): boolean {
 try {
  if (!isLeadAcceptance(value) || typeof window === 'undefined' || (window as TrackingWindow).__paulaGoogleConsentFailed) return false;
  const choice = savedConsent();
  const engine = runtime();
  if (!choice?.advertising) clearAcceptedHistory();
  if (engine?.consent(choice ?? { analytics: false, advertising: false })) clearGoogleCookies();
  if (!choice?.advertising || !engine) return false;
  const measured = new Set<string>();
  try {
   const stored: unknown = JSON.parse(sessionStorage.getItem(ACCEPTED_KEY) ?? '[]');
   if (Array.isArray(stored)) for (const id of stored.slice(-100)) if (isSubmissionId(id)) measured.add(id);
  } catch { /* In-document and Google transaction_id guards remain available. */ }
  if (measured.has(value.eventId) || !engine.acceptedLead(value)) return false;
  measured.add(value.eventId);
  try { sessionStorage.setItem(ACCEPTED_KEY, JSON.stringify([...measured].slice(-100))); } catch { /* Keep runtime dedupe. */ }
  return true;
 } catch { return false; } // Optional measurement cannot interrupt accepted form UX.
}
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

function applyConsentUpdate(w: TrackingWindow, state: ConsentModeState): void {
 w.dataLayer ??= [];
 // Resolve dataLayer at call time. The head snippet normally defines gtag first.
 if (typeof w.gtag !== 'function') w.gtag = function gtag() { (w.dataLayer as unknown[]).push(arguments); };
 w.gtag('consent', 'update', state);
}

/** Clear only first-party Google measurement cookies when consent is withdrawn. */
function clearGoogleCookies(): void {
 clearAcceptedHistory();
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
  if (!choice.advertising) clearAcceptedHistory();
  if (runtime()?.consent(choice)) clearGoogleCookies();
 } catch { /* No page business flow depends on storage synchronization. */ }
}
if (typeof window !== 'undefined') {
 window.addEventListener('storage', (event) => {
  if (event.key === CONSENT_KEY || event.key === null) reconcileConsent();
 });
 window.addEventListener('pageshow', reconcileConsent);
}

