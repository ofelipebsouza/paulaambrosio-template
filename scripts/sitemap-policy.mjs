/** Public canonical pages only; excluding a URL here does not remove its page. */
export const SITEMAP_ORIGIN = 'https://www.paulaambrosio.com';
const PRIVATE_ROOTS = new Set(['admin', 'api', 'auth', 'login', 'logout', 'sign-in', 'sign-out']);
const NOINDEX_PATHS = new Set(['/404', '/sitemap-pages', '/style-guides-and-branding', '/host-up', '/layout-starter-kit', '/change-order']);

export function isPublicSitemapUrl(value) {
 try {
  const url = new URL(value);
  if (url.origin !== SITEMAP_ORIGIN || url.search || url.hash || url.username || url.password) return false;
  const pathname = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';
  if (PRIVATE_ROOTS.has(pathname.split('/')[1].toLowerCase())) return false;
  return !NOINDEX_PATHS.has(pathname.toLowerCase());
 } catch { return false; }
}

/** A noindex document's canonical can point elsewhere (e.g. 404 -> home). */
export function isNoindexSitemapEntry(servedUrl, noindex, sitemapUrls) {
 return noindex && sitemapUrls.has(servedUrl);
}
