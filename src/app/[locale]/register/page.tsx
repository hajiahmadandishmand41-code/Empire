import { redirect } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';

/**
 * /[locale]/register redirects to the full-featured auth register page.
 * The canonical register page lives at /[locale]/auth/register.
 */
export default async function RegisterRedirectPage() {
  const locale = await getLocale();
  redirect({ href: '/auth/register', locale });
}
