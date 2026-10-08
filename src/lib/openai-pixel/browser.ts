/** Consent-gated Pixel and opaque, server-accepted lead events. No manual user data. */
import { OPENAI_PIXEL_ENABLED } from './config';
import { isLeadAcceptance, isSubmissionId, type LeadAcceptance } from '../lead-acceptance';
import { CONSENT_KEY, CONSENT_MAX_AGE, parseConsent } from '../google-tracking/core';

const PIXEL_ID = 'DLYetutJXaTeayWo2pLYiF';
const SCRIPT_ID = 'paula-openai-pixel';
const SDK_URL = 'https://bzrcdn.openai.com/sdk/oaiq.min.js';
const MEASURED_KEY = 'paula_openai_measured_v1';
type Command = unknown[];
type PixelQueue = ((...args: unknown[]) => void) & { q?: Command[] };
type PixelWindow = Window & { oaiq?: PixelQueue; __paulaOpenAIPixel?: { needsReload: boolean; measure?: (receipt: LeadAcceptance) => boolean } };

export function openAIPixelAvailable(): boolean {
 return typeof window !== 'undefined' && OPENAI_PIXEL_ENABLED && location.hostname === 'www.paulaambrosio.com' &&
  !/^\/(admin|api|style-guides-and-branding)(\/|$)/.test(location.pathname);
}
export function openAIPixelNeedsReload(): boolean {
 return typeof window !== 'undefined' && Boolean((window as PixelWindow).__paulaOpenAIPixel?.needsReload);
}

/** The caller passes only an acceptance receipt returned by our HTTPS contact route. */
export function measureAcceptedLead(value: unknown): boolean {
 if (!isLeadAcceptance(value) || !openAIPixelAvailable()) return false;
 try {
  installOpenAIBasePixel();
  return (window as PixelWindow).__paulaOpenAIPixel?.measure?.({ version: 1, eventId: value.eventId }) ?? false;
 } catch { return false; } // Measurement must never change form delivery or UX.
}

/** Independent of GTM: one initialization and one optional SDK request per document. */
export function installOpenAIBasePixel(): void {
 if (!openAIPixelAvailable()) return;
 const w = window as PixelWindow;
 if (w.__paulaOpenAIPixel) return;
 w.__paulaOpenAIPixel = { needsReload: false };
 let initialized = false;
 let revoked = false;
 let sdkReady = false;
 const measured = new Set<string>();
 const pending = new Map<string, LeadAcceptance>();
 let expiryTimer: ReturnType<typeof setTimeout> | undefined;
 const clearCookies = () => {
  for (const name of ['__oppref', '__obref']) {
   for (const domain of ['', '; Domain=paulaambrosio.com', '; Domain=www.paulaambrosio.com']) {
    document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax; Secure`;
   }
  }
 };
 const deny = () => {
  pending.clear();
  try { sessionStorage.removeItem(MEASURED_KEY); } catch { /* In-memory gate remains denied. */ }
  if (!initialized) return;
  revoked = true;
  w.__paulaOpenAIPixel!.needsReload = true;
  if (!sdkReady) {
   // Removing an in-flight tag alone is insufficient: discard stale queued grants.
   if (w.oaiq?.q) w.oaiq.q.splice(0, w.oaiq.q.length, ['consent', false]);
   document.getElementById(SCRIPT_ID)?.remove();
  }
  w.oaiq?.('consent', false);
  clearCookies();
 };
 const reconcile = () => {
  if (expiryTimer !== undefined) clearTimeout(expiryTimer);
  let choice = null;
  try { choice = parseConsent(localStorage.getItem(CONSENT_KEY), Date.now()); } catch { /* Deny on storage failure. */ }
  if (!choice?.advertising) { deny(); return; }
  if (revoked) return; // Reload unloads old vendor code before permission can resume.
  // Browser timers have a ~24-day maximum; re-read long-lived preferences in slices.
  expiryTimer = setTimeout(reconcile, Math.min(2_147_000_000, choice.at + CONSENT_MAX_AGE - Date.now() + 1));
  if (initialized) return;
  // Do not attach our account to a foreign loader or initialize duplicate site tags.
  if (w.oaiq || document.getElementById(SCRIPT_ID)) return;
  initialized = true;
  const q: PixelQueue = (...args) => { q.q?.push(args); };
  q.q = [];
  w.oaiq = q;
  q('consent', false); // Official consent API: denial precedes initialization.
  q('init', { pixelId: PIXEL_ID, debug: false });
  q('consent', true);
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.referrerPolicy = 'origin';
  script.src = SDK_URL;
  script.onload = () => {
   sdkReady = true;
   reconcile();
   const queued = [...pending.values()];
   pending.clear();
   for (const receipt of queued) send(receipt);
  };
  script.onerror = deny;
  document.head.append(script);
 };
 const send = (receipt: LeadAcceptance): boolean => {
  // Re-read at dispatch, including a response received after withdrawal or expiry.
  reconcile();
  if (!initialized || revoked) return false;
  let allowed = false;
  try { allowed = parseConsent(localStorage.getItem(CONSENT_KEY), Date.now())?.advertising === true; } catch { /* deny */ }
  if (!allowed) return false;
  try {
   const saved: unknown = JSON.parse(sessionStorage.getItem(MEASURED_KEY) ?? '[]');
   if (Array.isArray(saved)) for (const id of saved.slice(-100)) if (isSubmissionId(id)) measured.add(id);
  } catch { /* Vendor event_id also deduplicates when session storage is unavailable. */ }
  if (measured.has(receipt.eventId) || pending.has(receipt.eventId)) return false;
  if (!sdkReady) { pending.set(receipt.eventId, receipt); return true; }
  try {
   if (typeof w.oaiq !== 'function') return false;
   w.oaiq('measure', 'lead_created', { type: 'customer_action' }, {
    event_id: receipt.eventId, opt_out: true,
   });
   measured.add(receipt.eventId);
   try { sessionStorage.setItem(MEASURED_KEY, JSON.stringify([...measured].slice(-100))); } catch { /* Keep memory guard. */ }
   return true;
  } catch { return false; }
 };
 w.__paulaOpenAIPixel.measure = send;
 window.addEventListener('paula:consent-change', reconcile);
 window.addEventListener('paula:consent-denied', () => {
  revoked = true;
  w.__paulaOpenAIPixel!.needsReload = true;
  deny();
 });
 window.addEventListener('storage', event => {
  if (event.key === CONSENT_KEY || event.key === null) reconcile();
 });
 window.addEventListener('pageshow', reconcile);
 document.addEventListener('visibilitychange', reconcile);
 reconcile();
}
