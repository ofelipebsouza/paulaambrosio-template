/**
 * Definitive cover + date fix using the blog index card map (authoritative
 * per-post thumbnail + date). Falls back to the per-page most-referenced
 * .jpg for any slug missing from the index.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DIR = path.resolve('.freebuff/blog-import');
const ASSETS = path.resolve('src/assets/journal');
const CONTENT = path.resolve('src/content/journal');
const map = JSON.parse(fs.readFileSync(path.join(DIR, 'card-map.json'), 'utf8'));

function hash(file) {
	return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
}
import crypto from 'node:crypto';

async function download(url, dest) {
	const res = await fetch(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
			Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
			Referer: 'https://www.paulaambrosio.com/',
		},
	});
	if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
	fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
	await new Promise((r) => setTimeout(r, 1200));
}

async function optimize(raw, dest) {
	const img = sharp(raw).rotate();
	const meta = await img.metadata();
	// Flatten PNG (transparency) onto white, resize, mozjpeg
	let pipe = img.flatten({ background: '#ffffff' });
	await pipe.resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(dest);
}

const slugs = fs.readdirSync(DIR).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''));
const report = [];

for (const slug of slugs) {
	const card = map[slug];
	let coverUrl = card?.image ?? null;

	// Fallback: most-referenced jpg/jpeg on the page itself
	if (!coverUrl) {
		const html = fs.readFileSync(path.join(DIR, `${slug}.html`), 'utf8');
		const counts = {};
		for (const m of html.matchAll(/https:\/\/framerusercontent\.com\/images\/[A-Za-z0-9]+\.jpe?g/g)) {
			counts[m[0]] = (counts[m[0]] ?? 0) + 1;
		}
		coverUrl = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
	}
	if (!coverUrl) { report.push([slug, 'NO COVER URL']); continue; }

	const coverDest = path.join(ASSETS, `${slug}-cover.jpg`);
	try {
		const base = coverUrl.split('/').pop();
		const raw = path.join(DIR, 'img', `cover-${base}`);
		if (!fs.existsSync(raw)) await download(coverUrl, raw);
		await optimize(raw, coverDest);
	} catch (e) { report.push([slug, `dl/opt failed: ${e.message}`]); continue; }

	const mdxPath = path.join(CONTENT, `${slug}.mdx`);
	if (!fs.existsSync(mdxPath)) { report.push([slug, 'NO MDX']); continue; }
	let src = fs.readFileSync(mdxPath, 'utf8');
	const parts = src.split('---\n', 2);
	const fm = parts[0] + '---\n' + parts[1] + '---\n';
	let body = src.slice(fm.length);
	const coverHash = hash(coverDest);

	// Replace/remove body copies of the cover image
	let replacedFirst = false;
	body = body.replace(/!\[([^\]]*)\]\(\.\.\/\.\.\/assets\/journal\/[^)]+\)/g, (whole, alt) => {
		const f = whole.match(/journal\/([^)]+)\)/)?.[1];
		if (!f) return whole;
		const fp = path.join(ASSETS, f);
		if (!fs.existsSync(fp)) return '';
		if (hash(fp) === coverHash) {
			if (!replacedFirst) { replacedFirst = true; return `![${alt.replace(/"/g, '')}](../../assets/journal/${slug}-cover.jpg)`; }
			return '';
		}
		return whole;
	});
	body = body.replace(/\n{3,}/g, '\n\n').trim() + '\n';

	// Restore authoritative date from the index card
	let fm2 = fm;
	if (card?.date && /date: "/.test(fm2) && !fm2.includes(`date: "${card.date}"`)) {
		fm2 = fm2.replace(/date: "[^"]*"/, `date: "${card.date}"`);
		// mark as updated since original publish date is unknown/changed
		if (!/updatedDate:/.test(fm2)) fm2 = fm2.replace(/(date: "[^"]*"\n)/, `$1updatedDate: "${new Date().toISOString().slice(0, 10)}"\n`);
	}

	fs.writeFileSync(mdxPath, fm2 + body);
	report.push([slug, 'ok']);
}

console.table(report.map(([slug, status]) => ({ slug: slug.slice(0, 42), status })));
