/** Base Pixel only. There are deliberately no conversion or user-data calls. */
import { OPENAI_PIXEL_ENABLED } from './config';
import { CONSENT_KEY, CONSENT_MAX_AGE, parseConsent } from '../google-tracking/core';

const PIXEL_ID = 'DLYetutJXaTeayWo2pLYiF';
const SCRIPT_ID = 'paula-openai-pixel';
const SDK_URL = 'https://bzrcdn.openai.com/sdk/oaiq.min.js';
type Command = unknown[];
type PixelQueue = ((...args: unknown[]) => void) & { q?: Command[] };
type PixelWindow = Window & { oaiq?: PixelQueue; __paulaOpenAIPixel?: { needsReload: boolean } };

export function openAIPixelAvailable(): boolean {
 return typeof window !== 'undefined' && OPENAI_PIXEL_ENABLED && location.hostname === 'www.paulaambrosio.com' &&
  !/^\/(admin|api|style-guides-and-branding)(\/|$)/.test(location.pathname);
}
export function openAIPixelNeedsReload(): boolean {
 return typeof window !== 'undefined' && Boolean((window as PixelWindow).__paulaOpenAIPixel?.needsReload);
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
 let expiryTimer: ReturnType<typeof setTimeout> | undefined;
 const clearCookies = () => {
  for (const name of ['__oppref', '__obref']) {
   for (const domain of ['', '; Domain=paulaambrosio.com', '; Domain=www.paulaambrosio.com']) {
    document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax; Secure`;
   }
  }
 };
 const deny = () => {
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
  script.onload = () => { sdkReady = true; reconcile(); };
  script.onerror = deny;
  document.head.append(script);
 };
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
