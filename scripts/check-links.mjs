/**
 * Post-build validation:
 * 1. Collects every internal href/src referenced by dist HTML files and
 *    verifies the target exists in dist (catches broken internal links).
 * 2. Reports which pages emit JSON-LD structured data and which do not,
 *    so schema coverage can be reviewed before deploy.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');

function walk(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		return entry.isDirectory() ? walk(full) : full;
	});
}

const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
const routes = new Set();
for (const file of htmlFiles) {
	const rel = path.relative(DIST, file).replace(/\\/g, '/');
	if (rel.endsWith('index.html')) {
		routes.add('/' + rel.slice(0, -'index.html'.length));
	} else {
		routes.add('/' + rel);
	}
}

const hrefRe = /(?:href|src)="([^"#]+)"/g;
const missing = [];
const noSchema = [];

for (const file of htmlFiles) {
	const html = fs.readFileSync(file, 'utf8');
	const rel = '/' + path.relative(DIST, file).replace(/\\/g, '/');

	for (const match of html.matchAll(hrefRe)) {
		let href = match[1];
		if (href.startsWith('mailto:') || href.startsWith('tel:')) continue;
		if (/^https?:\/\//.test(href)) continue; // external
		if (href.startsWith('//')) continue;
		if (/\.(css|js|svg|png|jpg|jpeg|webp|avif|woff2?|ico|xml|txt)$/i.test(href)) continue;
		if (!href.startsWith('/')) continue; // relative anchor
		href = href.split('?')[0];
		let target = href.endsWith('/') ? href : href + '/';
		if (routes.has(target)) continue;
		if (href === '/404') continue;
		missing.push(`${rel}  ->  ${href}`);
	}

	if (!/<script type="application\/ld\+json">/.test(html)) {
		noSchema.push(rel);
	}
}

console.log(`Pages: ${htmlFiles.length}`);
if (missing.length) {
	console.log(`\nBROKEN INTERNAL LINKS (${missing.length}):`);
	missing.forEach((m) => console.log('  ' + m));
} else {
	console.log('Internal links: OK (no broken references)');
}

if (noSchema.length) {
	console.log(`\nPages WITHOUT JSON-LD (${noSchema.length}):`);
	noSchema.forEach((m) => console.log('  ' + m));
} else {
	console.log('Structured data: present on every page');
}
