import { OGImageRoute } from 'astro-og-canvas';
import { getAllPages, ogKey, type PageMeta } from '../../lib/pages';
import { site } from '../../site.config';

// One 1200x630 PNG per page, rendered at build time. The font is a subset of
// Noto Sans JP used only here; browsers never download it. Rebuild it with
// scripts/build-og-font.py.
const pages = Object.fromEntries((await getAllPages()).map((p) => [ogKey(p.path), p]));

export const { getStaticPaths, GET } = await OGImageRoute<PageMeta>({
  pages,
  getSlug: (path) => `${path}.png`,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: `${page.description}\n\n${site.name}  ·  ${site.jobTitle}  ·  danavira.com`,
    bgGradient: [[255, 255, 255]],
    border: { color: [17, 17, 17], width: 12, side: 'inline-start' },
    padding: 80,
    fonts: ['./src/assets/fonts/og-noto-sans-jp-bold.ttf'],
    font: {
      title: { families: ['Noto Sans JP'], size: 68, color: [17, 17, 17], lineHeight: 1.2 },
      description: {
        families: ['Noto Sans JP'],
        size: 32,
        color: [102, 102, 102],
        lineHeight: 1.4,
      },
    },
  }),
});
