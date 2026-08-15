import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import type { Direction } from '@/types';

/**
 * Empire Shop locales:
 * - fa: Dari (default)
 * - ps: Pashto
 * - en: English
 */
export const routing = defineRouting({
  locales: ['fa', 'ps', 'en'] as const,
  defaultLocale: 'fa',
  localePrefix: 'always',
});

export type AppLocale = (typeof routing.locales)[number];

/**
 * Logical direction per locale.
 * Used by next-intl + CSS `dir=` attribute.
 */
export const localeDirection: Record<AppLocale, Direction> = {
  fa: 'rtl',
  ps: 'rtl',
  en: 'ltr',
};

/** Localized `<html lang="..." />` value. */
export function htmlLang(locale: AppLocale): string {
  return locale;
}

/** Lightweight helpers around next-intl navigation. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
