// Every built page with its title and description. The OG image route renders
// one image per entry here, and BaseLayout points og:image at the same key, so
// a page added without an entry here fails scripts/check-dist.mjs in CI.
import { localizedPath, locales, t } from '../i18n';
import { collectionLocales, getPage, getProjects, getPublishedPosts, slugOf } from './content';

export interface PageMeta {
  path: string;
  title: string;
  description: string;
}

/** `/ja/projects/x/` becomes `ja/projects/x`; the home page is `index`. */
export function ogKey(pathname: string): string {
  return pathname.replace(/^\/+|\/+$/g, '') || 'index';
}

export async function getAllPages(): Promise<PageMeta[]> {
  const out: PageMeta[] = [];
  const projectLocales = await collectionLocales('projects');

  for (const locale of locales) {
    const dict = t(locale);
    const add = (path: string, title: string, description: string) =>
      out.push({ path: localizedPath(locale, path), title, description });

    for (const slug of ['home', 'cv']) {
      const page = await getPage(locale, slug);
      if (page) add(slug === 'home' ? '' : slug, page.data.title, page.data.description);
    }

    if (projectLocales.includes(locale)) {
      add('projects', dict.projectsIndex.title, dict.projectsIndex.description);
      for (const p of await getProjects(locale)) {
        const path = p.data.featured ? 'homelab' : `projects/${slugOf(p)}`;
        add(path, p.data.title, p.data.description);
      }
    }

    const posts = await getPublishedPosts(locale);
    if (posts.length > 0) {
      add('writing', dict.writingIndex.title, dict.writingIndex.description);
      for (const post of posts) {
        add(`writing/${slugOf(post)}`, post.data.title, post.data.description);
      }
    }
  }

  out.push({
    path: '/404/',
    title: t('en').notFound.title,
    description: t('en').notFound.description,
  });
  return out;
}
