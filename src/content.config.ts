import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const seoFields = {
	seoTitle: z.string().optional(),
	seoDescription: z.string().optional(),
};

const faqSchema = z.array(
	z.object({
		question: z.string().min(1),
		answer: z.string().min(1),
	}),
);

/** Per-entry CTA labels (the plan's red instruction markers, now real config). */
const ctaSchema = z
	.object({
		primary: z.string().min(1),
		secondary: z.string().min(1).optional(),
		secondaryHref: z.string().min(1).optional(),
		bannerTitle: z.string().min(1).optional(),
		bannerBody: z.string().min(1).optional(),
	})
	.optional();

const projectsCollection = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			draft: z.boolean().default(false),
			location: z.string().optional(),
			propertyType: z.string().optional(),
			projectType: z.string().optional(),
			year: z.number().int().optional(),
			services: z.array(z.string()).default([]),
			description: z.string().min(1),
			featuredImage: image(),
			imageAlt: z.string().optional(),
			gallery: z.array(image()).default([]),
			credits: z.string().optional(),
			relatedServices: z.array(z.string()).default([]),
			relatedLocations: z.array(z.string()).default([]),
			...seoFields,
		}),
});

const journalCollection = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/journal' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			draft: z.boolean().default(false),
			date: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			author: z.string().default('Paula Ambrosio'),
			category: z.string(),
			excerpt: z.string().min(1),
			featuredImage: image(),
			imageAlt: z.string().optional(),
			relatedServices: z.array(z.string()).default([]),
			relatedLocations: z.array(z.string()).default([]),
			relatedProjects: z.array(z.string()).default([]),
			canonical: z.string().url().optional(),
			...seoFields,
		}),
});

const servicesCollection = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/services' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			draft: z.boolean().default(false),
			introduction: z.string().min(1),
			heroSubheadline: z.string().optional(),
			featuredImage: image(),
			imageAlt: z.string().optional(),
			faqs: faqSchema.default([]),
			ctas: ctaSchema,
			...seoFields,
		}),
});

const locationsCollection = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/locations' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			draft: z.boolean().default(false),
			introduction: z.string().min(1),
			heroSubheadline: z.string().optional(),
			featuredImage: image(),
			imageAlt: z.string().optional(),
			faqs: faqSchema.default([]),
			ctas: ctaSchema,
			...seoFields,
		}),
});

export const collections = {
	projects: projectsCollection,
	journal: journalCollection,
	services: servicesCollection,
	locations: locationsCollection,
};
