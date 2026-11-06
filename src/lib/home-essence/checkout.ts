/** Accept only Stripe-hosted Payment Links, never arbitrary redirects. */
export function stripeCheckoutUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.hostname !== 'buy.stripe.com' ||
        url.username || url.password || url.port || url.hash ||
        !/^\/(?:test_)?[A-Za-z0-9]+\/?$/.test(url.pathname)) return '';
    return url.href;
  } catch { return ''; }
}
