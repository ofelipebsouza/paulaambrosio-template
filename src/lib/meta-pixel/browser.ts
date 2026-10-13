import { CONSENT_KEY, parseConsent } from '../google-tracking/core';
import { META_PIXEL_ENABLED } from './config';

const PIXEL_ID = '577841214418796';
const SCRIPT_ID = 'paula-meta-pixel';
const SDK_URL = 'https://connect.facebook.net/en_US/fbevents.js';
type MetaQueue = ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean; version?: string; push?: MetaQueue; callMethod?: (...args: unknown[]) => void; __paulaOwned?: boolean };
type MetaWindow = Window & { fbq?: MetaQueue; __paulaMetaPixel?: { needsReload: boolean } };

export function metaPixelAvailable(): boolean {
 return META_PIXEL_ENABLED && typeof window !== 'undefined' && location.hostname === 'www.paulaambrosio.com' &&
  !/^\/(admin|api|style-guides-and-branding)(\/|$)/.test(location.pathname);
}

export function installMetaPixel(): void {
 if (!metaPixelAvailable()) return;
 const w = window as MetaWindow;
 if (w.__paulaMetaPixel) return;
 w.__paulaMetaPixel = { needsReload: false };
 let initialized = false;
 let pageViewed = false;
 let revoked = false;
 let timer: ReturnType<typeof setTimeout> | undefined;
 const deny = () => {
  if (!initialized) return;
  revoked = true;
  w.__paulaMetaPixel!.needsReload = true;
  if (!initialized) return;
  if (w.fbq?.queue) w.fbq.queue.length = 0;
  if (w.fbq) w.fbq('consent', 'revoke');
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
  if (w.fbq || document.getElementById(SCRIPT_ID)) return;
  initialized = true;
  const fbq: MetaQueue = (...args) => {
   if (fbq.callMethod) fbq.callMethod(...args);
   else (fbq.queue ??= []).push(args);
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.__paulaOwned = true;
  fbq('consent', 'revoke');
  fbq('set', 'autoConfig', false, PIXEL_ID);
  fbq('init', PIXEL_ID);
  fbq('consent', 'grant');
  if (!pageViewed) { fbq('track', 'PageView'); pageViewed = true; }
  w.fbq = fbq;
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.referrerPolicy = 'origin';
  script.src = SDK_URL;
  script.onerror = deny;
  document.head.append(script);
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

