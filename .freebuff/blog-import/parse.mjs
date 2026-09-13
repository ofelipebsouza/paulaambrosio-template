/**
 * Parse downloaded Framer blog HTML into structured JSON for MDX generation.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('.freebuff/blog-import');

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html'));
const posts = [];

for (const file of files) {
	const html = fs.readFileSync(path.join(DIR, file), 'utf8');
	const slug = file.replace(/\.html$/, '');

	// Title
	const title =
		html.match(/<title>([^<]+)<\/title>/)?.[1]?.split('|')[0]?.trim() ??
		html.match(/property="og:title" content="([^"]+)"/)?.[1] ?? slug;

	// Meta description / excerpt
	const excerpt =
		html.match(/<meta name="description" content="([^"]*)"/)?.[1] ??
		html.match(/property="og:description" content="([^"]*)"/)?.[1] ?? '';

	// Published date: JSON-LD or meta
	let date = html.match(/property="article:published_time" content="([^"]+)"/)?.[1];
	if (!date) {
		const ld = html.match(/"datePublished":"([^"]+)"/)?.[1];
		if (ld) date = ld;
	}

	// og image
	const ogImage = html.match(/property="og:image" content="([^"]+)"/)?.[1] ?? '';

	// Body: Framer wraps post content; find the richest text container.
	// Strategy: strip script/style, then take the segment between the H1 and the footer/CTA.
	let body = '';
	const h1Idx = html.search(/<h1[\s>]/i);
	if (h1Idx >= 0) {
		// find footer or final CTA to cut
		const cutMarkers = [
			/<footer/i,
			/Ready to Begin Your Design Journey/,
			/<h2[^>]*>\s*(Related|More from|Subscribe)/i,
		];
		let end = html.length;
		for (const re of cutMarkers) {
			const m = html.slice(h1Idx + 10).search(re);
			if (m > 0) end = Math.min(end, h1Idx + 10 + m);
		}
		body = html.slice(h1Idx, end);
	}

	// Collect content images from the body region
	const imgUrls = new Set();
	const imgRe = /<img[^>]+(?:src|srcset)="([^"]+)"/g;
	let m;
	while ((m = imgRe.exec(body))) {
		for (const part of m[1].split(',')) {
			const u = part.trim().split(/\s+/)[0];
			if (/^https?:\/\//.test(u)) imgUrls.add(u);
		}
	}
	// Also images in srcset attributes anywhere near the top (Framer uses srcset)
	const ssRe = /srcset="([^"]+)"/g;
	const region = body || html;
	while ((m = ssRe.exec(region))) {
		for (const part of m[1].split(',')) {
			const u = part.trim().split(/\s+/)[0];
			if (/^https?:\/\//.test(u) && !/logo|avatar|icon/i.test(u)) imgUrls.add(u);
		}
	}

	posts.push({
		slug,
		title,
		excerpt,
		date,
		ogImage,
		images: [...imgUrls],
		bodyLength: body.length,
		body,
	});
}

fs.writeFileSync(path.join(DIR, 'posts.json'), JSON.stringify(posts, null, 2));
console.log(`Parsed ${posts.length} posts`);
for (const p of posts) {
	console.log(
		`${p.date ?? 'NO-DATE'}  imgs=${String(p.images.length).padStart(2)}  body=${String(p.bodyLength).padStart(6)}  ${p.slug}`,
	);
}
