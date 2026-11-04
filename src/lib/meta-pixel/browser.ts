import { CONSENT_KEY, parseConsent } from '../google-tracking/core';
import { isLeadAcceptance, type LeadAcceptance } from '../lead-acceptance';
import { META_PIXEL_ENABLED } from './config';

const PIXEL_ID = '577841214418796';
const SCRIPT_ID = 'paula-meta-pixel';
const SDK_URL = 'https://connect.facebook.net/en_US/fbevents.js';
type MetaQueue = ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean; version?: string; push?: MetaQueue; callMethod?: (...args: unknown[]) => void; __paulaOwned?: boolean };
type MetaWindow = Window & { fbq?: MetaQueue; _fbq?: MetaQueue; __paulaMetaPixel?: { needsReload: boolean; checkout?: () => boolean; lead?: (receipt: LeadAcceptance) => boolean } };

export function metaPixelAvailable(): boolean {
 return META_PIXEL_ENABLED && typeof window !== 'undefined' && location.hostname === 'www.paulaambrosio.com' &&
  !/^\/(admin|api|style-guides-and-branding)(\/|$)/.test(location.pathname);
}

export function installMetaPixel(): void {
 if (!metaPixelAvailable()) return;
 const w = window as MetaWindow;
 if (w.__paulaMetaPixel) return;
 w.__paulaMetaPixel = { needsReload: false };
 let ownedQueue: MetaQueue | undefined;
 let initialized = false;
 const measuredLeads = new Set<string>();
 let pageViewed = false;
 let revoked = false;
 let timer: ReturnType<typeof setTimeout> | undefined;
 const deny = () => {
  if (!initialized) return;
  revoked = true;
  w.__paulaMetaPixel!.needsReload = true;
  if (!initialized) return;
  if (ownedQueue?.queue) ownedQueue.queue.length = 0;
  if (ownedQueue) ownedQueue('consent', 'revoke');
  document.getElementById(SCRIPT_ID)?.remove();
  // Revocation is terminal for this document; reload is required before reinit.
 };
 const reconcile = () => {
  if (timer !== undefined) clearTimeout(timer);
  let consent = null;
  try { consent = parseConsent(localStorage.getItem(CONSENT_KEY), Date.now()); } catch { /* deny */ }
  if (revoked) return;
  if (!consent?.advertising) { deny(); return; }
  timer = setTimeout(reconcile, Math.min(2_147_000_000, consent.at + 90 * 86_400_000 - Date.now() + 1));
  if (initialized) return;
  if (revoked) return;
  if (w.fbq || w._fbq || document.getElementById(SCRIPT_ID)) return;
  initialized = true;
  const fbq: MetaQueue = (...args) => {
   if (fbq.callMethod) fbq.callMethod(...args);
   else (fbq.queue ??= []).push(args);
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.push = fbq;
  fbq.__paulaOwned = true;
  fbq('consent', 'revoke');
  fbq('set', 'autoConfig', false, PIXEL_ID);
  fbq('init', PIXEL_ID);
  fbq('consent', 'grant');
  if (!pageViewed) { fbq('track', 'PageView'); pageViewed = true; }
  ownedQueue = fbq;
  w.fbq = fbq;
  if (!w._fbq) w._fbq = fbq;
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.referrerPolicy = 'origin';
  script.src = SDK_URL;
  script.onerror = deny;
  document.head.append(script);
 };
 w.__paulaMetaPixel.checkout = () => {
  reconcile(); // Re-read stored consent at the action, including expiry/storage failure.
  if (revoked || !initialized || !ownedQueue || w.fbq !== ownedQueue || w._fbq !== ownedQueue) return false;
  // Target only our pixel even if another integration later adds a pixel ID.
  ownedQueue('trackSingle', PIXEL_ID, 'InitiateCheckout');
  return true;
 };
 w.__paulaMetaPixel.lead = receipt => {
  reconcile();
  if (revoked || !initialized || !ownedQueue || w.fbq !== ownedQueue || w._fbq !== ownedQueue || measuredLeads.has(receipt.eventId)) return false;
  // Reserve before calling the SDK: a throwing SDK must not cause a duplicate retry.
  measuredLeads.add(receipt.eventId);
  ownedQueue('trackSingle', PIXEL_ID, 'Lead', {}, { eventID: receipt.eventId });
  return true;
 };
 window.addEventListener('paula:consent-change', reconcile);
 window.addEventListener('paula:consent-denied', () => { revoked = true; w.__paulaMetaPixel!.needsReload = true; deny(); });
 window.addEventListener('storage', event => { if (event.key === CONSENT_KEY || event.key === null) reconcile(); });
 window.addEventListener('pageshow', reconcile);
 reconcile();
}
export function metaPixelNeedsReload(): boolean {
 return typeof window !== 'undefined' && Boolean((window as MetaWindow).__paulaMetaPixel?.needsReload);
}

/** Called only by the genuine outbound checkout handler; no URL or form data sent. */
export function trackMetaCheckout(): boolean {
 if (!metaPixelAvailable()) return false;
 try { return (window as MetaWindow).__paulaMetaPixel?.checkout?.() ?? false; }
 catch { return false; } // Tracking failure must never prevent checkout navigation.
}

/** Only an opaque server acceptance receipt can trigger a lead; never forward form fields. */
export function measureMetaAcceptedLead(value: unknown): boolean {
 try {
  if (!isLeadAcceptance(value) || !metaPixelAvailable()) return false;
  return (window as MetaWindow).__paulaMetaPixel?.lead?.(value) ?? false;
 } catch { return false; } // Optional tracking cannot interrupt the form's result.
}
