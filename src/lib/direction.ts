import { localeDirection, type AppLocale } from '@/i18n/routing';
import type { Direction } from '@/types';

/**
 * Map a locale to its logical document direction.
 * Re-exported from `i18n/routing` so callers can import a single source of truth.
 */
export function getDirection(locale: AppLocale): Direction {
  return localeDirection[locale];
}

/**
 * Logical-property helpers.
 * Tailwind's `start`/`end` utilities already handle RTL; these helpers are for
 * attributes that need an explicit value (CSS vars, ARIA, etc.).
 */
export const logical = {
  start: 'inline-start',
  end: 'inline-end',
} as const;

/** `lang` attribute for the active locale. */
export const htmlLangFor = (locale: AppLocale): string => locale;
