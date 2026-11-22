/**
 * Build-time social share images: one branded 1200×630 JPEG per shareable page
 * (photo + white logo), plus the ivory brand banner. Naming contract lives in
 * `src/lib/og.ts`; rendering lives in `src/lib/og-render.ts`.
 */
import type { APIRoute, ImageMetadata } from 'astro';
import { getCollection } from 'astro:content';
import { ogAssetId } from '../../lib/og';
import { renderBrandBanner, renderPhotoBanner, resolveSource } from '../../lib/og-render';

import { getHomeHeroProjects } from '../../lib/home-hero';

interface OgProps {
	img?: ImageMetadata;
}

export async function getStaticPaths() {
	const projects = (await getCollection('projects')).filter((p) => !p.data.draft);
	const [homeHero] = getHomeHeroProjects(projects);
	const services = await getCollection('services');
	const locations = await getCollection('locations');
	const journal = (await getCollection('journal')).filter((p) => !p.data.draft);
	const spaces = (await getCollection('spaces')).filter((s) => !s.data.draft);

	const photos: { id: string; img: ImageMetadata }[] = [
		// Share the same residential cover as the home carousel.
		...(homeHero ? [{ id: ogAssetId('home', 'residential'), img: homeHero.data.featuredImage }] : []),
		// Keep the original share URL valid for links already distributed.
		...(projects[0] ? [{ id: ogAssetId('home', 'hero'), img: projects[0].data.featuredImage }] : []),
		...projects.map((p) => ({ id: ogAssetId('project', p.id), img: p.data.featuredImage })),
		...services.map((s) => ({ id: ogAssetId('service', s.id), img: s.data.featuredImage })),
		...locations.map((l) => ({ id: ogAssetId('location', l.id), img: l.data.featuredImage })),
		...journal.map((p) => ({ id: ogAssetId('journal', p.id), img: p.data.featuredImage })),
		...spaces.map((s) => ({ id: ogAssetId('space', s.id), img: s.data.heroImage })),
	];

	return [
		{ params: { id: ogAssetId('brand', 'banner') }, props: {} },
		...photos.map(({ id, img }) => ({ params: { id }, props: { img } })),
	];
}

export const GET: APIRoute = async ({ props }) => {
	const { img } = props as OgProps;
	try {
		const body = img ? await renderPhotoBanner(resolveSource(img)) : await renderBrandBanner();
		return new Response(new Uint8Array(body), {
			headers: {
				'Content-Type': 'image/jpeg',
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		});
	} catch (error) {
		// Surface the cause in dev; a static build must fail loudly instead.
		if (!import.meta.env.DEV) throw error;
		return new Response(`OG render failed: ${error instanceof Error ? error.message : error}`, {
			status: 500,
		});
	}
};
