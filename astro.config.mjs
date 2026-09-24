import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	// Canonical production origin — used by sitemap + canonical URLs.
	// Must match the host that actually serves the site: vercel.json redirects
	// the apex domain here, and every canonical/og:url/sitemap entry uses it.
	site: 'https://www.paulaambrosio.com',
	// Every page stays statically generated. Only the contact endpoint opts into
	// on-demand rendering (`export const prerender = false` in
	// src/pages/api/contact.ts), which is why the Vercel adapter is required.
	output: 'static',
	adapter: vercel(),
	integrations: [sitemap(), mdx()],
	vite: {
		plugins: [tailwindcss()],
	},
});
