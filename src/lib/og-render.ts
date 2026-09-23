/**
 * Build-time social banner rendering (imported only by `src/pages/og/[id].jpg.ts`).
 *
 * Every share image is a 1200×630 JPEG: either the ivory brand banner with the
 * official black logo, or page photography with the white logo over a soft
 * gradient scrim. Crawlers never render SVG in share cards, so the vectorized
 * logo is rasterized here once per page per build.
 */
import sharp from 'sharp';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ImageMetadata } from 'astro';
import { OG_WIDTH, OG_HEIGHT } from './og';

const IVORY = '#F9F5F0';
const SAND = '#CEB297';
const LOGO_MARGIN = 56;

const logoSvg = (variant: 'black' | 'white'): Buffer =>
	readFileSync(join(process.cwd(), 'public', 'brand', `logo-${variant}.svg`));

/** Rasterizes the vector logo well above banner scale, then scales down. */
async function logoOverlay(variant: 'black' | 'white', width: number): Promise<Buffer> {
	return sharp(logoSvg(variant), { density: 300 }).resize({ width }).png().toBuffer();
}

/** Ivory brand banner: hairline sand frame + official logo centered. */
export async function renderBrandBanner(): Promise<Buffer> {
	const logo = await logoOverlay('black', 600);
	const frame = Buffer.from(
		`<svg width="${OG_WIDTH}" height="${OG_HEIGHT}"><rect x="36" y="36" width="${OG_WIDTH - 72}" height="${OG_HEIGHT - 72}" fill="none" stroke="${SAND}" stroke-width="2"/></svg>`,
	);
	return sharp({ create: { width: OG_WIDTH, height: OG_HEIGHT, channels: 3, background: IVORY } })
		.composite([{ input: frame }, { input: logo, gravity: 'center' }])
		.jpeg({ quality: 90, mozjpeg: true })
		.toBuffer();
}

/** Photo banner: cover-cropped photography with the white logo bottom-left. */
export async function renderPhotoBanner(source: string): Promise<Buffer> {
	const logo = await logoOverlay('white', 380);
	const { height: logoHeight = 52 } = await sharp(logo).metadata();
	const scrim = Buffer.from(
		`<svg width="${OG_WIDTH}" height="${OG_HEIGHT}">` +
			`<defs><linearGradient id="g" x1="0" y1="1" x2="0.8" y2="0">` +
			`<stop offset="0" stop-color="#000" stop-opacity="0.55"/>` +
			`<stop offset="0.55" stop-color="#000" stop-opacity="0"/>` +
			`</linearGradient></defs>` +
			`<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#g)"/></svg>`,
	);
	return sharp(source)
		.resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
		.composite([
			{ input: scrim },
			{ input: logo, left: LOGO_MARGIN, top: OG_HEIGHT - LOGO_MARGIN - logoHeight },
		])
		.jpeg({ quality: 82, mozjpeg: true })
		.toBuffer();
}

/**
 * Resolves an ImageMetadata back to its file on disk. `src` is a Vite URL
 * (`/@fs/<abs path>?query` in dev, hashed asset URL in build), so normalize it
 * and map it through the source-module glob to reach the original file.
 */
const assetModules = import.meta.glob('/src/assets/**/*.{jpg,jpeg,png,webp,avif}', {
	eager: true,
	import: 'default',
});
const normalizeSrc = (src: string) => decodeURIComponent(src.split('?')[0]);
const fsPathBySrc = new Map<string, string>(
	Object.entries(assetModules).map(([key, meta]) => [
		normalizeSrc((meta as ImageMetadata).src),
		join(process.cwd(), key.replace(/^\//, '')),
	]),
);

export function resolveSource(img: ImageMetadata): string {
	const raw = img.src.split('?')[0];
	const candidates = [
		raw.startsWith('/@fs/') ? decodeURIComponent(raw.slice('/@fs/'.length)) : decodeURIComponent(raw),
		fsPathBySrc.get(normalizeSrc(img.src)) ?? '',
		join(process.cwd(), decodeURIComponent(raw).replace(/^\//, '')),
	];
	for (const candidate of candidates) {
		if (candidate && existsSync(candidate)) return candidate;
	}
	throw new Error(`OG source image not found on disk: ${img.src}`);
}
