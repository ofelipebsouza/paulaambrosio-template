/**
 * Generate journal MDX + optimized images from the downloaded Framer blog HTML.
 * - Keeps original slugs (enables clean /blog/* -> /journal/* redirects)
 * - Downloads content images, dedupes by base URL, optimizes with sharp
 * - Converts body HTML to MDX-safe markdown
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DIR = path.resolve('.freebuff/blog-import');
const OUT_CONTENT = path.resolve('src/content/journal');
const OUT_ASSETS = path.resolve('src/assets/journal');
fs.mkdirSync(OUT_ASSETS, { recursive: true });

const CATEGORY_RULES = [
	[/hotel|hospitality|wellness-as-luxury|miami-hospitality/, 'Hospitality Design'],
	[/turnkey/, 'Turnkey Design'],
	[/tiles|stone|millwork|wall-|materials|window-treatments|lighting|smart-home/, 'Materials & Details'],
	[/real-estate|property-value|investment|developers|sell-30-percent|choose-an-interior-designer/, 'Real Estate & Investment'],
	[/trends|boho|milan/, 'Trends & Inspiration'],
	[/padel|garage-gym|culture-lifestyle|quality-of-life/, 'Lifestyle & Culture'],
	[/spa-bathroom|closet|furniture/, 'Rooms & Spaces'],
	[/coastal|oceanfront|furnish-miami-home-from-abroad|magic-of-miami|welcome-to/, 'Miami Living'],
];

function categoryFor(slug, title) {
	for (const [re, cat] of CATEGORY_RULES) if (re.test(slug) || re.test(title.toLowerCase())) return cat;
	return 'Interior Design';
}

function unescapeEntities(s) {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>');
}

/** Convert a body HTML fragment to markdown. Returns { md, images: [{base, alt}] } */
function htmlToMarkdown(html) {
	let h = html
		.replace(/<(script|style|svg|iframe|noscript)[\s\S]*?<\/\1>/gi, '')
		.replace(/<!--[\s\S]*?-->/g, '');

	const images = [];
	// Replace <img> with markers
	h = h.replace(/<img[^>]*>/gi, (tag) => {
		const src = tag.match(/(?:src|srcset)="([^"]+)"/i)?.[1] ?? '';
		const first = unescapeEntities(src.split(',')[0].trim().split(/\s+/)[0] || '');
		const base = first.split('?')[0];
		if (!/^https?:\/\/.+\.(jpe?g|png|webp|avif)/i.test(base)) return '';
		if (/logo|avatar|icon/i.test(base)) return '';
		const alt = unescapeEntities(tag.match(/alt="([^"]*)"/i)?.[1] ?? '').trim();
		let idx = images.findIndex((i) => i.base === base);
		if (idx === -1) {
			images.push({ base, alt });
			idx = images.length - 1;
		}
		return `\n\n[IMG:${idx}]\n\n`;
	});

	const inline = (s) =>
		unescapeEntities(
			s
				.replace(/<br\s*\/?>/gi, '\n')
				.replace(/<\/?(b|strong)>/gi, '**')
				.replace(/<\/?(i|em)>/gi, '*')
				.replace(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) =>
					/^https?:\/\//.test(unescapeEntities(href)) ? `[${text}](${unescapeEntities(href)})` : text,
				)
				.replace(/<[^>]+>/g, ''),
		).trim();

	const blocks = [];
	// Walk top-level-ish elements we care about
	const re = /<(h1|h2|h3|h4|p|ul|ol|blockquote|li)[^>]*>([\s\S]*?)<\/\1>/gi;
	let m;
	while ((m = re.exec(h))) {
		const tag = m[1].toLowerCase();
		const inner = m[2];
		if (tag === 'ul' || tag === 'ol') {
			const lis = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((li) => `- ${inline(li[1])}`);
			if (lis.length) blocks.push(lis.join('\n'));
			continue;
		}
		if (tag === 'blockquote') {
			blocks.push(`> ${inline(inner)}`);
			continue;
		}
		if (tag === 'h2') blocks.push(`## ${inline(inner)}`);
		else if (tag === 'h3' || tag === 'h4') blocks.push(`### ${inline(inner)}`);
		else {
			const text = inline(inner);
			if (text) blocks.push(text);
		}
	}
	// Standalone image markers that weren't inside p tags
	const orphanMarkers = h.match(/\[IMG:\d+\]/g) ?? [];
	for (const om of orphanMarkers) blocks.push(om);

	// Collapse duplicates and empty
	let md = blocks.join('\n\n').replace(/\n{3,}/g, '\n\n');
	// MDX safety: escape < { } in text (not inside links already produced)
	md = md.replace(/</g, '&lt;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
	return { md: md.trim(), images };
}

async function download(url, dest) {
	const res = await fetch(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
			Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
			Referer: 'https://www.paulaambrosio.com/',
		},
	});
	if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
	const buf = Buffer.from(await res.arrayBuffer());
	fs.writeFileSync(dest, buf);
	// Pace requests — framerusercontent rate-limits bursts to a fallback image.
	await new Promise((r) => setTimeout(r, 1200));
	return buf.length;
}

async function main() {
	const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html'));
	const report = [];
	let downloaded = 0;

	for (const file of files) {
		const slug = file.replace(/\.html$/, '');
		const html = fs.readFileSync(path.join(DIR, file), 'utf8');

		const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
		const title = h1Match
			? unescapeEntities(h1Match[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
			: (html.match(/property="og:title" content="([^"]+)"/)?.[1] ?? slug);
		const excerpt = unescapeEntities(
			html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '',
		).trim();
		const date =
			html.match(/<time[^>]*datetime="([^"]+)"/i)?.[1] ??
			html.match(/property="article:published_time" content="([^"]+)"/)?.[1] ??
			null;

		// Body segment: from H1 to footer/CTA
		const h1Idx = html.search(/<h1[\s>]/i);
		let body = '';
		if (h1Idx >= 0) {
			let end = html.length;
			for (const cut of [/<footer/i, /Ready to Begin Your Design Journey/i, /<h2[^>]*>\s*(Related|More from|Subscribe)/i]) {
				const i = html.slice(h1Idx + 10).search(cut);
				if (i > 0) end = Math.min(end, h1Idx + 10 + i);
			}
			body = html.slice(h1Idx, end);
		}

		const { md, images } = htmlToMarkdown(body);
		if (!title || md.length < 400) {
			report.push({ slug, ok: false, reason: `body too short (${md.length})` });
			continue;
		}

		// Download + optimize images
		const localNames = [];
		for (let i = 0; i < images.length; i++) {
			const { base } = images[i];
			const name = i === 0 ? `${slug}-cover.jpg` : `${slug}-${String(i + 1).padStart(2, '0')}.jpg`;
			const dest = path.join(OUT_ASSETS, name);
			try {
				const raw = path.join(DIR, 'img', path.basename(base));
				fs.mkdirSync(path.dirname(raw), { recursive: true });
				if (!fs.existsSync(raw)) await download(base, raw);
				await sharp(raw).rotate().resize({ width: 1800, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(dest);
				localNames.push(name);
				downloaded++;
			} catch (e) {
				console.warn(`  ! image failed ${base}: ${e.message}`);
			}
		}

		if (!localNames.length) {
			report.push({ slug, ok: false, reason: 'no images downloaded' });
			continue;
		}

		// Inline image markers -> markdown with local paths
		let bodyMd = md.replace(/\[IMG:(\d+)\]/g, (_, n) => {
			const name = localNames[+n];
			const alt = (images[+n]?.alt || title).replace(/"/g, '');
			return name ? `![${alt}](../../assets/journal/${name})` : '';
		});
		bodyMd = bodyMd.replace(/!\[[^\]]*\]\(\)/g, '').replace(/\n{3,}/g, '\n\n').trim();

		const category = categoryFor(slug, title);
		const relatedServices = [];
		if (/turnkey/.test(slug)) relatedServices.push('turnkey-interior-design-miami');
		if (/hotel|hospitality|wellness|miami-hospitality/.test(slug)) relatedServices.push('hospitality-interior-design-miami');

		const lower = (title + ' ' + md.slice(0, 4000)).toLowerCase();
		const relatedLocations = ['miami beach', 'sunny isles', 'aventura', 'bal harbour', 'boca raton', 'palm beach']
			.filter((c) => lower.includes(c))
			.map((c) => c.replace(/\b\w/g, (ch) => ch.toLowerCase()).replace(' ', '-'));
		if (/miami/.test(slug) && !relatedLocations.length && category !== 'Trends & Inspiration') relatedLocations.push('miami');

		const fm = {
			title,
			date: date ? date.slice(0, 10) : null,
			category,
			excerpt,
			featuredImage: `../../assets/journal/${localNames[0]}`,
			imageAlt: (images[0]?.alt || title).replace(/"/g, ''),
			relatedServices,
			relatedLocations,
		};
		// Posts without any source date (12 of 36) are dated at migration time — honest and keeps them fresh.
		fm.date = fm.date ?? new Date().toISOString().slice(0, 10);

		const mdx = `---
${Object.entries(fm)
	.map(([k, v]) => {
		if (Array.isArray(v)) return v.length ? `${k}:\n${v.map((x) => `  - ${JSON.stringify(x)}`).join('\n')}` : null;
		return `${k}: ${JSON.stringify(v)}`;
	})
	.filter(Boolean)
	.join('\n')}
---

${bodyMd}
`;
		fs.writeFileSync(path.join(OUT_CONTENT, `${slug}.mdx`), mdx);
		report.push({ slug, ok: true, title, date: fm.date, category, images: localNames.length, chars: bodyMd.length });
	}

	console.table(report.map(({ slug, ok, ...r }) => ({ slug: slug.slice(0, 40), ...r })));
	console.log(`Done: ${report.filter((r) => r.ok).length} written, ${downloaded} images optimized`);
}

main();
