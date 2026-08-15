import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { routing, type AppLocale } from './routing';

/**
 * Loads the message catalog for the active locale.
 * next-intl calls this for every server-rendered route under `/[locale]`.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Default locale guard — must be a known locale or 404.
  if (!locale || !routing.locales.includes(locale as AppLocale)) {
    locale = routing.defaultLocale;
  }

  try {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    return { locale, messages };
  } catch {
    notFound();
  }
});
