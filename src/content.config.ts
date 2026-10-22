import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every image carries alt text. An empty string fails the build, so a diagram
// or cover can never ship without a description.
const figure = ({ image }: SchemaContext) =>
  z.object({
    src: image(),
    alt: z.string().trim().min(1, 'alt text is required'),
  });

// Entries live under <collection>/<locale>/<slug>.mdx. The locale folder is
// what decides whether a /ja/ page exists, see src/lib/content.ts.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: (ctx) =>
    z.object({
      title: z.string(),
      description: z.string().max(200),
      // Exactly one featured project per locale. It renders at /homelab with
      // the wide layout instead of under /projects/.
      featured: z.boolean().default(false),
      // Lower sorts first on /projects and the home page.
      order: z.number().int().default(100),
      stack: z.array(z.string()).min(1),
      architecture: figure(ctx).optional(),
      cover: figure(ctx).optional(),
      links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
      draft: z.boolean().default(false),
    }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/writing' }),
  schema: (ctx) =>
    z.object({
      title: z.string(),
      description: z.string().max(200),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      cover: figure(ctx).optional(),
      // Drafts render in `pnpm dev` only. They never reach the build, RSS,
      // sitemap or nav.
      draft: z.boolean().default(false),
    }),
});

// Copy for fixed pages (home, cv). A ja/<page>.mdx file is what turns on the
// Japanese version of that page.
const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(200),
    identity: z.string().optional(),
  }),
});

export const collections = { projects, writing, pages };
