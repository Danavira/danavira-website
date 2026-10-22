import { getCollection, type CollectionEntry } from 'astro:content';
import { locales, type Locale } from '../i18n';

type Entry = CollectionEntry<'projects'> | CollectionEntry<'writing'> | CollectionEntry<'pages'>;

/** Entry ids look like `en/homelab`. */
export function localeOf(entry: Entry): Locale {
  const [locale] = entry.id.split('/');
  if (!locales.includes(locale as Locale)) {
    throw new Error(
      `${entry.collection}/${entry.id}: first folder must be one of ${locales.join(', ')}`,
    );
  }
  return locale as Locale;
}

export function slugOf(entry: Entry): string {
  return entry.id.split('/').slice(1).join('/');
}

const showDrafts = import.meta.env.DEV;

export async function getProjects(locale: Locale) {
  const all = await getCollection(
    'projects',
    (p) => localeOf(p) === locale && (showDrafts || !p.data.draft),
  );
  const featured = all.filter((p) => p.data.featured);
  if (featured.length > 1) {
    throw new Error(
      `Only one featured project allowed per locale, found ${featured.map((p) => p.id).join(', ')}`,
    );
  }
  return all.sort(
    (a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title),
  );
}

export async function getFeaturedProject(locale: Locale) {
  return (await getProjects(locale)).find((p) => p.data.featured);
}

/** Single source of truth for "is there anything to show" checks in nav, home and RSS. */
export async function getPublishedPosts(locale: Locale) {
  const posts = await getCollection(
    'writing',
    (p) => localeOf(p) === locale && (showDrafts || !p.data.draft),
  );
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getPage(locale: Locale, slug: string) {
  const pages = await getCollection('pages', (p) => localeOf(p) === locale && slugOf(p) === slug);
  return pages[0];
}

/** Locales in which a fixed page (home, cv) has a source file. */
export function pageLocales(slug: string): Promise<Locale[]> {
  return localesWhere(async (l) => (await getPage(l, slug)) !== undefined);
}

/** Locales in which a collection entry with this slug exists. */
export async function entryLocales(collection: 'projects' | 'writing', slug: string) {
  const entries = await getCollection(
    collection,
    (e) => slugOf(e) === slug && (showDrafts || !e.data.draft),
  );
  return entries.map(localeOf);
}

/** Locales that have at least one entry, for index pages like /ja/projects/. */
export async function collectionLocales(collection: 'projects' | 'writing'): Promise<Locale[]> {
  const entries = await getCollection(collection, (e) => showDrafts || !e.data.draft);
  return locales.filter((l) => entries.some((e) => localeOf(e) === l));
}

async function localesWhere(test: (l: Locale) => Promise<boolean>): Promise<Locale[]> {
  const hits = await Promise.all(locales.map(async (l) => ((await test(l)) ? l : null)));
  return hits.filter((l): l is Locale => l !== null);
}

/** Locales with a featured project, i.e. where /homelab/ exists. */
export function featuredLocales() {
  return localesWhere(async (l) => (await getFeaturedProject(l)) !== undefined);
}

/** Locales with at least one published post, i.e. where /writing/ exists. */
export function postLocales() {
  return localesWhere(async (l) => (await getPublishedPosts(l)).length > 0);
}

export function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  });
}
