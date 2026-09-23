/**
 * Social share (OG) asset URLs.
 *
 * Social crawlers (Facebook, WhatsApp, LinkedIn, X) do not render SVG in share
 * previews, so every share image is a 1200×630 JPEG rendered at build time by
 * `src/pages/og/[id].jpg.ts` from the official vector logo. `ogAssetId` is the
 * single naming contract between the pages that emit `<meta og:image>` and the
 * endpoint that generates the files — always build IDs through these helpers.
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export type OgKind = 'project' | 'service' | 'location' | 'journal' | 'home';

/** Ivory brand banner with the official logo — used by pages without a photo. */
export const OG_BANNER = '/og/brand-banner.jpg';
export const OG_BANNER_ALT = 'Paula Ambrosio Interiors — luxury interior design studio in Miami';

/** Home share image (first project cover, mirroring `src/pages/index.astro`). */
export const HOME_OG = '/og/home-hero.jpg';

/** Stable file id inside `/og/` — slugs may contain slashes; URLs may not. */
export const ogAssetId = (kind: OgKind | 'brand', id: string): string =>
	`${kind}-${id.replace(/[\\/]/g, '-')}`;

/** Photo-backed share image for a content entry. */
export const brandedOg = (kind: OgKind, id: string): string =>
	`/og/${ogAssetId(kind, id)}.jpg`;
