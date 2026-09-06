import { redirect } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';

/**
 * /[locale]/login redirects to the full-featured auth login page.
 * The canonical login page lives at /[locale]/auth/login.
 */
export default async function LoginRedirectPage() {
  const locale = await getLocale();
  redirect({ href: '/auth/login', locale });
}
