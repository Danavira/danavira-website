import { getRelativeLocaleUrl } from 'astro:i18n';
import { en, type Dictionary } from './en';
import { ja } from './ja';

export const locales = ['en', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

const dictionaries: Record<Locale, Dictionary> = { en, ja };

export function t(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** `path` has no leading slash, e.g. `projects/homelab`. Empty string is home. */
export function localizedPath(locale: Locale, path = ''): string {
  return getRelativeLocaleUrl(locale, path);
}

/** The `[...locale]` route param: undefined for English at the root. */
export function localeParam(locale: Locale): string | undefined {
  return locale === defaultLocale ? undefined : locale;
}

export function localeFromParam(param: string | undefined): Locale {
  return param === 'ja' ? 'ja' : 'en';
}

/** Which locales a given page exists in, mapped to that version's URL. */
export type Alternates = Partial<Record<Locale, string>>;

export function alternatesFor(have: readonly Locale[], path = ''): Alternates {
  return Object.fromEntries(have.map((l) => [l, localizedPath(l, path)]));
}
