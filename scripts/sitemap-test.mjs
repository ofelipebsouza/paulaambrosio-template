import assert from 'node:assert/strict';
import test from 'node:test';
import { isPublicSitemapUrl, isNoindexSitemapEntry, SITEMAP_ORIGIN } from './sitemap-policy.mjs';

test('private API/admin/auth routes and noindex pages are excluded', () => {
 for (const path of ['/admin', '/admin/', '/admin/login/', '/admin/leads/123/', '/api/contact/', '/auth/callback/', '/login/', '/logout/', '/sign-in/', '/sign-out/', '/404/', '/sitemap-pages/', '/style-guides-and-branding/', '/%61dmin/']) {
  assert.equal(isPublicSitemapUrl(SITEMAP_ORIGIN + path), false, path);
 }
});
test('all useful public page families and luxury service routes remain included', () => {
 for (const path of ['/', '/about/', '/contact/', '/services/', '/design-consultation-miami/', '/design-express-miami/', '/turnkey-interior-design-miami/', '/luxury-residential-interior-design-miami/', '/hospitality-interior-design-miami/', '/projects/home-ka/', '/journal/why-well-designed-homes-sell-30-percent-faster/', '/interior-design-miami/', '/interior-designer-bal-harbour/', '/spaces/laundry-room/', '/privacy/', '/faq/', '/podcast/', '/links/']) {
  assert.equal(isPublicSitemapUrl(SITEMAP_ORIGIN + path), true, path);
 }
});
test('noncanonical origins, queries, fragments and malformed URLs are excluded', () => {
 for (const url of ['https://paulaambrosio.com/contact/', 'http://www.paulaambrosio.com/', 'https://preview.vercel.app/', 'https://www.paulaambrosio.com.evil.test/', SITEMAP_ORIGIN + '/?utm_source=fixture', SITEMAP_ORIGIN + '/#contact', '/relative/', 'not a URL', SITEMAP_ORIGIN + '/%ZZ']) {
  assert.equal(isPublicSitemapUrl(url), false, url);
 }
});

test('noindex 404 canonicalizing to home does not exclude or flag the homepage', () => {
 const listed = new Set([SITEMAP_ORIGIN + '/']);
 assert.equal(isNoindexSitemapEntry(SITEMAP_ORIGIN + '/404.html', true, listed), false);
 assert.equal(isNoindexSitemapEntry(SITEMAP_ORIGIN + '/', false, listed), false);
 listed.add(SITEMAP_ORIGIN + '/style-guides-and-branding/');
 assert.equal(isNoindexSitemapEntry(SITEMAP_ORIGIN + '/style-guides-and-branding/', true, listed), true);
});
