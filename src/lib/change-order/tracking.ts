import { installMetaPixel, trackMetaCheckout } from '../meta-pixel/browser';
import { checkoutUrl } from './checkout';

/** Explicit release switch, baked into the build after ownership/GTM review. */
export function installChangeOrderTracking(enabled = import.meta.env.PUBLIC_CHANGE_ORDER_META_DIRECT_ENABLED === 'true'): void {
 if (!enabled) return;
 const link = document.getElementById('checkout-link');
 if (!(link instanceof HTMLAnchorElement) || link.dataset.trackingInstalled) return;
 installMetaPixel();
 link.dataset.trackingInstalled = 'true';
 let checkoutTracked = false;
 window.addEventListener('pageshow', () => { checkoutTracked = false; });
 link.addEventListener('click', event => {
  // Count only a real, uncancelled primary activation of the displayed destination.
  // Never emit on modal, email, selection, page load, or restored pages.
  const addon = document.getElementById('include-addon') as HTMLInputElement | null;
  const expected = checkoutUrl(addon?.checked ? document.body.dataset.checkoutBundle : document.body.dataset.checkoutBase);
  if (checkoutTracked || !event.isTrusted || event.defaultPrevented || event.button !== 0 || link.hidden || !expected || link.href !== expected) return;
  // Reserve this departure only after measurement succeeds; denial/failure can retry.
  if (trackMetaCheckout()) checkoutTracked = true;
 });
}
