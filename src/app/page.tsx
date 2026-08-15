import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

/**
 * Root entry point.
 *
 * `/` must open the storefront at the default locale (`/fa`), not a
 * dashboard. Locale negotiation for other locales is handled by the
 * next-intl middleware.
 */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
