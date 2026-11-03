/** Only direct HTTPS Hotmart payment links. Never infer an offer or redirect URL. */
export function checkoutUrl(value: unknown): string {
 if (typeof value !== 'string' || !value.trim()) return '';
 try {
  const url = new URL(value.trim());
  if (url.protocol !== 'https:' || url.hostname !== 'pay.hotmart.com' || url.port ||
      url.username || url.password || !/^\/[A-Za-z0-9]+\/?$/.test(url.pathname) || url.hash) return '';
  return url.href;
 } catch { return ''; }
}
