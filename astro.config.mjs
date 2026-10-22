// @ts-check
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import { readdirSync, readFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeMermaid from 'rehype-mermaid';

// /projects/<slug>/ of the featured project is only a redirect to /homelab/,
// so it is kept out of the sitemap. Read from frontmatter directly because
// content collections are not available while the config loads.
const projectsDir = new URL('./src/content/projects/', import.meta.url);
const redirectOnly = readdirSync(projectsDir, { recursive: true })
  .filter((f) => String(f).endsWith('.mdx'))
  .filter((f) =>
    /^featured:\s*true\s*$/m.test(readFileSync(new URL(String(f), projectsDir), 'utf8')),
  )
  .map((f) => {
    const [locale, ...rest] = String(f)
      .replace(/\.mdx$/, '')
      .split('/');
    return `${locale === 'en' ? '' : `/${locale}`}/projects/${rest.join('/')}/`;
  });

export default defineConfig({
  site: 'https://danavira.com',
  output: 'static',
  // Cloudflare Pages and nginx both serve /foo/index.html at /foo/ and redirect
  // /foo there, so canonical URLs carry the slash to match what is served.
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ja'],
    routing: { prefixDefaultLocale: false },
  },
  markdown: {
    // Mermaid blocks are left for rehype-mermaid instead of being highlighted.
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid', 'math'] },
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
    // remark/rehype pipeline instead of Astro's default Satteri, because
    // rehype-mermaid is a rehype plugin. MDX inherits this processor.
    processor: unified({
      // Renders Mermaid to SVG at build time with headless Chromium, so no
      // Mermaid code reaches the browser. `dark: true` emits a second SVG that
      // a <picture> swaps in under prefers-color-scheme: dark.
      rehypePlugins: [[rehypeMermaid, { strategy: 'img-svg', dark: true }]],
      // SmartyPants turns "---" into an em dash, which the copy rules forbid.
      // Quotes and ellipses are still curled.
      smartypants: { dashes: false },
    }),
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', ja: 'ja' } },
      filter: (page) => {
        const path = new URL(page).pathname;
        return path !== '/404/' && !redirectOnly.includes(path);
      },
    }),
  ],
});
