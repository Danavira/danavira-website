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

/** Display order of certification groups. Within a group, file order wins. */
export const certCategories = ['kubernetes', 'cloud', 'language', 'skills'] as const;

const byOrder = (a: { data: { order: number } }, b: { data: { order: number } }) =>
  a.data.order - b.data.order;

/** Entries in the order they appear in src/data/certifications.yaml. */
export async function getCertifications() {
  return (await getCollection('certifications')).sort(byOrder);
}

export async function getExperience(section: 'work' | 'project') {
  return (await getCollection('experience', (e) => e.data.section === section)).sort(byOrder);
}

/** A src/data/ list (skills, education) in file order. */
export async function getOrdered<C extends 'skills' | 'education'>(
  collection: C,
): Promise<CollectionEntry<C>[]> {
  return ((await getCollection(collection)) as CollectionEntry<C>[]).sort(byOrder);
}

/** `2026-02` or a Date, shown as "Feb 2026" / "2026年2月". en-US rather than
 *  en-GB for English, which abbreviates September as "Sept". */
export function formatMonth(value: string | Date, locale: Locale): string {
  const date = typeof value === 'string' ? new Date(`${value}-01T00:00:00+09:00`) : value;
  return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'short',
    timeZone: 'Asia/Tokyo',
  });
}

/** URL segment for a tag: lowercase, spaces and punctuation collapsed to `-`. */
export function tagSlug(tag: string): string {
  return tag
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');
}

/** Every tag used by a published post in this locale, with its post count. */
export async function getTags(locale: Locale) {
  const counts = new Map<string, { tag: string; count: number }>();
  for (const post of await getPublishedPosts(locale)) {
    for (const tag of post.data.tags) {
      const slug = tagSlug(tag);
      const seen = counts.get(slug);
      counts.set(slug, { tag: seen?.tag ?? tag, count: (seen?.count ?? 0) + 1 });
    }
  }
  return [...counts.entries()]
    .map(([slug, v]) => ({ slug, ...v }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Journal entries, newest first. Drafts only in `pnpm dev`. */
export async function getJournal() {
  const entries = await getCollection('journal', (e) => showDrafts || !e.data.draft);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** `en/2026-11-05-shibuya` becomes `2026-11-05-shibuya`. */
export function journalSlug(entry: CollectionEntry<'journal'>): string {
  return entry.id.split('/').slice(1).join('/');
}

/** Plain-text opening of an entry for cards, OG images and descriptions. */
export function journalExcerpt(entry: CollectionEntry<'journal'>, max = 160): string {
  const text = (entry.body ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return entry.data.title;
  return text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}\u2026` : text;
}
