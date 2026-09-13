/**
 * Import missing projects (home-tr, home-m, home-aa, commercial-hs) from the
 * old site: download ordered gallery images (srcset-heavy refs), optimize with
 * sharp, and emit MDX with minimal factual frontmatter (no invented facts).
 * NOTE: home-ga does not exist on the source site (404) — intentionally skipped.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DIR = path.resolve('.freebuff/projects-import');
const ASSETS = path.resolve('src/assets/projects');
const CONTENT = path.resolve('src/content/projects');

const PROJECTS = [
	{
		slug: 'home-tr',
		title: 'HOME TR',
		description: 'A private Miami residence by Paula Ambrosio Interiors — full interior design scope executed with the studio\u2019s signature materiality and detailing.',
		imageAlt: 'Interior of the HOME TR private residence in Miami by Paula Ambrosio Interiors',
		propertyType: 'Private Residence',
		projectType: 'Residential',
		relatedServices: [],
		relatedLocations: ['miami'],
		minRefs: 8,
	},
	{
		slug: 'home-m',
		title: 'HOME M',
		description: 'A private Miami residence by Paula Ambrosio Interiors — considered spatial planning, custom detailing and a refined material palette.',
		imageAlt: 'Interior of the HOME M private residence in Miami by Paula Ambrosio Interiors',
		propertyType: 'Private Residence',
		projectType: 'Residential',
		relatedServices: [],
		relatedLocations: ['miami'],
		minRefs: 8,
	},
	{
		slug: 'home-aa',
		title: 'HOME A&A',
		description: 'A bespoke Miami residence where refined architecture meets curated artistry — designed for sophisticated entertaining and everyday elegance.',
		imageAlt: 'Interior of the HOME A&A private residence in Miami by Paula Ambrosio Interiors',
		propertyType: 'Private Residence',
		projectType: 'Residential',
		relatedServices: [],
		relatedLocations: ['miami'],
		minRefs: 8,
	},
	{
		slug: 'commercial-hs',
		title: 'COMMERCIAL HS',
		description: 'A commercial hospitality environment by Paula Ambrosio Interiors — experience-driven design across guest-facing spaces, materials and lighting.',
		imageAlt: 'Interior of the COMMERCIAL HS hospitality project in Miami by Paula Ambrosio Interiors',
		propertyType: 'Hospitality / Commercial',
		projectType: 'Commercial',
		relatedServices: ['hospitality-interior-design-miami'],
		relatedLocations: ['miami'],
		minRefs: 9,
	},
];

const EXCLUDE = ['ILbxh1Jy', 'pQlJ9Q7', 'api9gl8h']; // shared chrome/decoration

async function download(url, dest) {
	const res = await fetch(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
			Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
			Referer: 'https://www.paulaambrosio.com/',
		},
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
	await new Promise((r) => setTimeout(r, 1200));
}

for (const p of PROJECTS) {
	const html = fs.readFileSync(path.join(DIR, `${p.slug}.html`), 'utf8');
	// Ordered distinct URLs by first appearance; keep those referenced >= minRefs (main gallery)
	const seen = new Map();
	for (const m of html.matchAll(/https:\/\/framerusercontent\.com\/images\/[A-Za-z0-9]+\.(?:jpe?g|png|webp)/g)) {
		const u = m[0];
		seen.set(u, (seen.get(u) ?? 0) + 1);
	}
	const galleryUrls = [...seen.entries()]
		.filter(([u, n]) => n >= p.minRefs && !EXCLUDE.some((x) => u.includes(x)))
		.map(([u]) => u);

	const outDir = path.join(ASSETS, p.slug);
	fs.mkdirSync(outDir, { recursive: true });
	const localNames = [];
	for (let i = 0; i < galleryUrls.length; i++) {
		const url = galleryUrls[i];
		const name = `${String(i + 1).padStart(2, '0')}.jpg`;
		const raw = path.join(DIR, 'img', `${p.slug}-${path.basename(url)}`);
		fs.mkdirSync(path.dirname(raw), { recursive: true });
		try {
			if (!fs.existsSync(raw)) await download(url, raw);
			await sharp(raw).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(outDir, name));
			localNames.push(name);
			console.log(`  ${p.slug}/${name} ok`);
		} catch (e) {
			console.warn(`  ! ${p.slug} ${url}: ${e.message}`);
		}
	}
	if (!localNames.length) { console.error(`${p.slug}: NO IMAGES`); continue; }

	const galleryList = localNames.slice(1).map((n) => `  - "../../assets/projects/${p.slug}/${n}"`).join('\n');
	const mdx = `---
title: ${JSON.stringify(p.title)}
location: "Miami, Florida"
propertyType: ${JSON.stringify(p.propertyType)}
projectType: ${JSON.stringify(p.projectType)}
services: []
description: ${JSON.stringify(p.description)}
featuredImage: "../../assets/projects/${p.slug}/${localNames[0]}"
imageAlt: ${JSON.stringify(p.imageAlt)}
relatedServices:
${p.relatedServices.map((s) => `  - "${s}"`).join('\n') || '  []'}
relatedLocations:
  - "miami"
gallery:
${galleryList || '  []'}
---

${p.description}

## Scope

Interior design and project coordination by Paula Ambrosio Interiors.
`;
	fs.writeFileSync(path.join(CONTENT, `${p.slug}.mdx`), mdx);
	console.log(`${p.slug}: ${localNames.length} images, MDX written`);
}
