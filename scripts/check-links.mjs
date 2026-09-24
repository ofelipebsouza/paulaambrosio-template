/**
 * Post-build validation — the guard that keeps the deployed site safe.
 *
 * It runs inside `npm run build` (see package.json + vercel.json `buildCommand`),
 * so a broken build never reaches production. Zero dependencies.
 *
 * Hard checks (exit code 1):
 *  1. No form action that is not https — an `action="mailto:…"` (or any http URL)
 *     on an HTTPS page is reported by Chrome as insecure form submission and
 *     fails Lighthouse `is-on-https`, dropping Best Practices to 77.
 *  2. No `href`/`src` pointing at plain http (mixed content / insecure request).
 *  3. Exactly one <h1> per page — accessibility + SEO.
 *  4. Internal links are served URLs: canonical host comes from the XML sitemap
 *     and page routes carry the trailing slash, so no link costs a redirect.
 *  5. No broken internal links (target missing from dist).
 *
 * Soft checks (reported, not fatal):
 *  - pages without JSON-LD structured data;
 *  - pages that are not listed in the XML sitemap.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');

/** Namespaces that are legitimately http in generated XML / JSON-LD. */
const ALLOWED_HTTP = /(?:www\.w3\.org|www\.sitemaps\.org|www\.google\.com\/schemas|schema\.org|purl\.org|ogp\.me)/i;
const ASSET_RE = /\.(css|js|mjs|svg|png|jpe?g|webp|avif|gif|ico|xml|txt|pdf|json|webmanifest|woff2?|mp4|mov)$/i;

function walk(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		return entry.isDirectory() ? walk(full) : full;
	});
}

const errors = [];
const warnings = [];

if (!fs.existsSync(DIST)) {
	console.error('dist/ not found — run `astro build` first.');
	process.exit(1);
}

const htmlFiles = walk(DIST).filter((file) => file.endsWith('.html'));

/** Route as the server serves it (directory pages end with a slash). */
function routeOf(file) {
	const rel = path.relative(DIST, file).replace(/\\/g, '/');
	return rel.endsWith('index.html') ? '/' + rel.slice(0, -'index.html'.length) : '/' + rel;
}

/** Directory pages are the indexed routes; standalone .html files (404) are not. */
const isDirectoryPage = (file) => file.endsWith('index.html');

const routes = new Set(htmlFiles.map(routeOf));

/** Canonical origin, taken from the generated XML sitemap. */
const sitemapPath = path.join(DIST, 'sitemap-0.xml');
const sitemapLocs = new Set();
let sitemapOrigin = null;
if (fs.existsSync(sitemapPath)) {
	const xml = fs.readFileSync(sitemapPath, 'utf8');
	for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
		sitemapLocs.add(match[1]);
		sitemapOrigin ??= new URL(match[1]).origin;
	}
}

if (!sitemapOrigin) {
	errors.push('sitemap-0.xml missing or empty — canonical host cannot be validated');
}

const noSchema = [];
const notInSitemap = [];
const insecureForms = [];
const insecureRefs = [];
const headingIssues = [];
const canonicalIssues = [];
const redirectingLinks = [];
const brokenLinks = [];

const refRe = /(href|src)="([^"]+)"/g;

for (const file of htmlFiles) {
	const html = fs.readFileSync(file, 'utf8');
	const route = routeOf(file);

	// 1. Insecure form actions (the Lighthouse `is-on-https` failure).
	for (const form of html.match(/<form[\s>][^>]*>/g) ?? []) {
		const action = form.match(/\saction="([^"]*)"/)?.[1];
		if (action === undefined) continue;
		if (!action.startsWith('https://')) insecureForms.push(`${route}  action="${action}"`);
	}

	// 2. Non-https references.
	for (const match of html.matchAll(refRe)) {
		const value = match[2];
		if (!value.startsWith('http://')) continue;
		if (ALLOWED_HTTP.test(value)) continue;
		insecureRefs.push(`${route}  ${match[1]}="${value.slice(0, 80)}"`);
	}

	// 3. Exactly one h1.
	const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
	if (h1Count !== 1) headingIssues.push(`${route}  ${h1Count} <h1> elements`);

	// 4. Canonical + og:url must be the served, sitemap-listed form.
	const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
	const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
	for (const [label, value] of [
		['canonical', canonical],
		['og:url', ogUrl],
	]) {
		if (!value) {
			canonicalIssues.push(`${route}  missing ${label}`);
			continue;
		}
		const origin = new URL(value).origin;
		if (sitemapOrigin && origin !== sitemapOrigin) {
			canonicalIssues.push(`${route}  ${label} uses ${origin}, sitemap uses ${sitemapOrigin}`);
		}
		const selfUrl = `${origin}${route}`;
		if (isDirectoryPage(file) && value !== selfUrl) {
			canonicalIssues.push(`${route}  ${label} is ${value}, served URL is ${selfUrl}`);
		}
	}

	// 5. Internal links resolve and use the trailing-slash form.
	for (const match of html.matchAll(refRe)) {
		let value = match[2];
		if (!value.startsWith('/') || value.startsWith('//')) continue;
		if (value.startsWith('/#') || value === '/') continue;
		value = value.split('?')[0].split('#')[0];
		if (ASSET_RE.test(value)) continue;
		const target = value.endsWith('/') ? value : `${value}/`;
		if (value !== '/' && !value.endsWith('/')) {
			redirectingLinks.push(`${route}  ${match[1]}="${value}" (costs a redirect)`);
		}
		if (!routes.has(target) && value !== '/404') brokenLinks.push(`${route}  ${match[1]}="${value}"`);
	}

	if (!/<script type="application\/ld\+json">/.test(html)) noSchema.push(route);
	if (sitemapLocs.size && canonical && !sitemapLocs.has(canonical)) notInSitemap.push(route);
}

function report(title, list, limit = 12) {
	if (!list.length) return;
	console.log(`\n${title} (${list.length}):`);
	for (const item of list.slice(0, limit)) console.log('  ' + item);
	if (list.length > limit) console.log(`  … ${list.length - limit} more`);
}

console.log(`Pages checked: ${htmlFiles.length}`);
console.log(`Canonical origin: ${sitemapOrigin ?? 'unknown'}`);
console.log(`Sitemap URLs: ${sitemapLocs.size}`);

errors.push(
	...insecureForms.map((i) => `INSECURE FORM ACTION  ${i}`),
	...insecureRefs.map((i) => `NON-HTTPS REFERENCE  ${i}`),
	...headingIssues.map((i) => `HEADING  ${i}`),
	...canonicalIssues.map((i) => `CANONICAL  ${i}`),
	...redirectingLinks.map((i) => `REDIRECTING LINK  ${i}`),
	...brokenLinks.map((i) => `BROKEN LINK  ${i}`),
);

report('Insecure form actions', insecureForms);
report('Non-https references', insecureRefs);
report('Heading problems', headingIssues);
report('Canonical / og:url problems', canonicalIssues);
report('Internal links that would redirect', redirectingLinks);
report('Broken internal links', brokenLinks);
report('Pages without JSON-LD (info)', noSchema);
report('Pages missing from the sitemap (info)', notInSitemap);
warnings.push(...noSchema, ...notInSitemap);

if (errors.length) {
	console.log(`\nFAILED — ${errors.length} problem(s) must be fixed before deploying.`);
	process.exit(1);
}

console.log(`\nOK — no insecure form actions, no http references, one h1 per page, canonicals match the sitemap.`);
if (warnings.length) console.log(`${warnings.length} informational note(s) above.`);
