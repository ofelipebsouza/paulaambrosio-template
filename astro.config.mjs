import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	// Canonical production origin — used by sitemap + canonical URLs.
	site: 'https://paulaambrosiointeriors.com',
	integrations: [sitemap(), mdx()],
	vite: {
		plugins: [tailwindcss()],
	},
});
