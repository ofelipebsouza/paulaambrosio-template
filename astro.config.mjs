import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	// Canonical production origin — used by sitemap + canonical URLs.
	// Must match the host that actually serves the site: vercel.json redirects
	// the apex domain here, and every canonical/og:url/sitemap entry uses it.
	site: 'https://www.paulaambrosio.com',
	integrations: [sitemap(), mdx()],
	vite: {
		plugins: [tailwindcss()],
	},
});
