import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import type { Direction } from '@/types';

/**
 * Empire Shop locales:
 * - fa: Dari (default fallback)
 * - ps: Pashto
 * - en: English
 *
 * Browser/device language negotiation is enabled. When the device language is
 * not supported, Persian remains the safe default.
 */
export const routing = defineRouting({
  locales: ['fa', 'ps', 'en'] as const,
  defaultLocale: 'fa',
  localePrefix: 'always',
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];

export const localeDirection: Record<AppLocale, Direction> = {
  fa: 'rtl',
  ps: 'rtl',
  en: 'ltr',
};

export function htmlLang(locale: AppLocale): string {
  return locale;
}

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
