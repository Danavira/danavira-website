import { defineCollection, type SchemaContext } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';

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

// .md as well as .mdx: the CMS at /admin/ writes plain Markdown, where a stray
// `{` or `<` in prose cannot break the build the way it does in MDX.
const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
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
    // Home page "About" block. Plain text; a blank line starts a new paragraph.
    about: z.string().optional(),
  }),
});

// Data for /certifications/, /cv/ and the generated cv.pdf. Not localized: names,
// dates and IDs read the same in every language.
// getCollection() does not keep file order, so each entry records its position
// in the list. Reordering a list in the CMS therefore reorders the site.
const ordered = (path: string) =>
  file(path, {
    parser: (text) =>
      (parse(text) as Record<string, unknown>[]).map((entry, order) => ({ ...entry, order })),
  });
const order = z.number().int();

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'use YYYY-MM');

const certifications = defineCollection({
  loader: ordered('src/data/certifications.yaml'),
  schema: ({ image }) =>
    z
      .object({
        order,
        name: z.string(),
        issuer: z.string(),
        category: z.enum(['kubernetes', 'cloud', 'language', 'skills']),
        earned: z.coerce.date(),
        expires: z.coerce.date().optional(),
        summary: z.string().optional(),
        credentialId: z.string().optional(),
        verifyUrl: z.url().optional(),
        credlyUrl: z.url().optional(),
        image: image().optional(),
        imageAlt: z.string().trim().min(1).optional(),
        // Path under public/, e.g. /certs/cka.pdf.
        pdf: z
          .string()
          .regex(/^\/certs\/[\w-]+\.pdf$/)
          .optional(),
        // Shown on the home page and at the top of the CV.
        featured: z.boolean().default(false),
      })
      .refine((c) => !c.image || c.imageAlt, {
        message: 'imageAlt is required when image is set',
        path: ['imageAlt'],
      }),
});

const experience = defineCollection({
  loader: ordered('src/data/experience.yaml'),
  schema: z.object({
    order,
    section: z.enum(['work', 'project']),
    role: z.string(),
    org: z.string(),
    orgNote: z.string().optional(),
    location: z.string().optional(),
    start: yearMonth,
    end: yearMonth.optional(),
    note: z.string().optional(),
    link: z.url().optional(),
    bullets: z.array(z.string()).min(1),
  }),
});

const skills = defineCollection({
  loader: ordered('src/data/skills.yaml'),
  schema: z.object({ order, label: z.string(), items: z.array(z.string()).min(1) }),
});

const education = defineCollection({
  loader: ordered('src/data/education.yaml'),
  schema: z.object({
    order,
    degree: z.string(),
    school: z.string(),
    location: z.string().optional(),
    graduated: yearMonth,
  }),
});

export const collections = {
  projects,
  writing,
  pages,
  certifications,
  experience,
  skills,
  education,
};
