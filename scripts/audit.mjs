/**
 * Deep static audit of dist/: SEO, AEO (structured data + machine-readable entity),
 * accessibility basics and performance signals. Zero dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');

function walk(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const full = path.join(dir, e.name);
		return e.isDirectory() ? walk(full) : full;
	});
}

const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));

const issues = [];
const warn = [];
const ok = [];

function add(list, file, msg) {
	list.push(`${file}  ${msg}`);
}

let totalImgNoAlt = 0;
let pagesNoCanonical = 0;
let pagesNoOg = 0;
let pagesNoTitle = 0;
let pagesNoDesc = 0;
let pagesH1Missing = 0;
let pagesMultiH1 = 0;
let pagesNoBreadcrumb = 0;

const schemaTypes = new Map();

for (const file of htmlFiles) {
	const html = fs.readFileSync(file, 'utf8');
	const rel = '/' + path.relative(DIST, file).replace(/\\/g, '/').replace(/index\.html$/, '');
	const short = rel === '/' ? '/ (home)' : rel.replace(/\/$/, '');

	// --- Basic SEO ---
	if (!/<title>[^<]{10,}<\/title>/.test(html)) { add(issues, short, 'missing/short <title>'); pagesNoTitle++; }
	if (!/<meta name="description" content="[^"]{50,}"/.test(html)) { add(issues, short, 'missing/short meta description'); pagesNoDesc++; }
	if (!/<link rel="canonical"/.test(html)) { add(issues, short, 'missing canonical'); pagesNoCanonical++; }
	if (!/<meta property="og:title"/.test(html) || !/<meta property="og:image"/.test(html)) { add(issues, short, 'missing OG title/image'); pagesNoOg++; }
	if (!/<html lang="en"/.test(html)) add(issues, short, 'missing html lang');
	if (!/<meta name="viewport"/.test(html)) add(issues, short, 'missing viewport meta');

	// --- Headings ---
	const h1s = html.match(/<h1[\s>]/g) ?? [];
	if (h1s.length === 0) { add(issues, short, 'no <h1>'); pagesH1Missing++; }
	else if (h1s.length > 1) { add(issues, short, `${h1s.length} <h1> elements`); pagesMultiH1++; }

	// --- Images alt text ---
	const imgs = html.match(/<img[^>]*>/g) ?? [];
	for (const img of imgs) {
		if (!/alt="[^"]+"/.test(img)) { totalImgNoAlt++; add(issues, short, 'img without alt: ' + img.slice(0, 90)); }
	}

	// --- AEO: JSON-LD ---
	const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
	if (ld.length === 0) {
		add(issues, short, 'NO JSON-LD');
	} else {
		for (const m of ld) {
			try {
				const data = JSON.parse(m[1]);
				const types = [];
				const collect = (n) => {
					if (!n) return;
					if (Array.isArray(n)) return n.forEach(collect);
					if (n['@type']) types.push(n['@type']);
					['@graph', 'mainEntity', 'breadcrumb', 'itemListElement'].forEach((k) => n[k] && collect(n[k]));
				};
				collect(data);
				for (const t of types) schemaTypes.set(t, (schemaTypes.get(t) ?? 0) + 1);
				if (types.includes('BreadcrumbList')) pagesNoBreadcrumb++;
			} catch (e) {
				add(issues, short, 'INVALID JSON-LD: ' + e.message);
			}
		}
	}

	// --- A11y signals ---
	if (!/<a[^>]*class="[^"]*skip[^>]*>/.test(html) && !/>Skip to content</.test(html)) add(warn, short, 'no skip link');
	// form inputs need labels
	for (const m of html.matchAll(/<(input|textarea|select)[^>]*>/g)) {
		const tag = m[0];
		if (/type="(hidden|submit)"/.test(tag)) continue;
		const id = tag.match(/id="([^"]+)"/)?.[1];
		if (id && !html.includes(`for="${id}"`) && !/aria-label=/.test(tag)) {
			add(issues, short, `form control #${id} without label`);
		}
	}
	// buttons without accessible text
	for (const m of html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)) {
		const inner = m[1].replace(/<[^>]*>/g, '').trim();
		if (!inner && !/aria-label=/.test(m[0])) add(issues, short, 'button without text or aria-label');
	}
	// links without text — note: a link whose only content is an <img> WITH alt
	// has an accessible name per the accname spec, so only flag truly empty ones.
	for (const m of html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)) {
		const inner = m[1].replace(/<[^>]*>/g, '').trim();
		const imgWithAlt = /<img[^>]*alt="[^"]+"[^>]*>/.test(m[1]);
		if (!inner && !imgWithAlt && !/aria-label=/.test(m[0])) add(issues, short, 'link without text or aria-label: ' + m[0].slice(0, 80));
	}

	// --- Perf signals ---
	if (/<script[^>]+src="https?:\/\/(?!www\.googletagmanager|cdn\.)[^"]*"]/.test(html)) add(warn, short, 'third-party script');
}

// ---------- Font/asset weight report ----------
const astroDir = path.join(DIST, '_astro');
let biggest = [];
if (fs.existsSync(astroDir)) {
	for (const f of fs.readdirSync(astroDir)) {
		const st = fs.statSync(path.join(astroDir, f));
		biggest.push([f, st.size]);
	}
	biggest.sort((a, b) => b[1] - a[1]);
}
const topAssets = biggest.slice(0, 6).map(([f, s]) => `    ${(s / 1024).toFixed(0)} KB  ${f}`);
const fontPreloads = [...(fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')).matchAll(/<link rel="preload"[^>]*href="([^"]+)"/g)].map((m) => m[1]);

// ---------- Report ----------
console.log(`\n=== AUDIT: ${htmlFiles.length} pages ===\n`);

console.log(`Schema types emitted: ${[...schemaTypes.entries()].map(([t, n]) => `${t}(${n})`).join(', ') || 'NONE'}\n`);

if (issues.length) {
	console.log(`ISSUES (${issues.length}):`);
	issues.forEach((i) => console.log('  ✗ ' + i));
} else {
	console.log('No blocking issues found.\n');
}
if (warn.length) {
	console.log(`\nWARNINGS (${warn.length}):`);
	warn.forEach((i) => console.log('  ! ' + i));
}

console.log('\nPreloaded fonts: ' + (fontPreloads.length ? fontPreloads.join(', ') : 'none'));
console.log('Largest assets:');
topAssets.forEach((l) => console.log(l));
