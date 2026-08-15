import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import {
  createGoogleState,
  GOOGLE_STATE_COOKIE,
  GOOGLE_STATE_MAX_AGE_SECONDS,
  googleClientId,
  googleConfigured,
  googleRedirectUri,
  requestOrigin,
} from '@/lib/auth/google';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestedLocale = req.nextUrl.searchParams.get('locale') ?? routing.defaultLocale;
  const locale = (routing.locales as readonly string[]).includes(requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const redirect = req.nextUrl.searchParams.get('redirect') ?? undefined;
  const errorUrl = new URL(`/${locale}/auth/login`, req.url);
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) errorUrl.searchParams.set('redirect', redirect);

  if (!googleConfigured()) {
    errorUrl.searchParams.set('error', 'google_not_configured');
    return NextResponse.redirect(errorUrl);
  }

  const state = createGoogleState(locale, redirect);
  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', googleClientId()!);
  googleUrl.searchParams.set('redirect_uri', googleRedirectUri(requestOrigin(req)));
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', state);
  googleUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(googleUrl);
  response.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: GOOGLE_STATE_MAX_AGE_SECONDS,
  });
  return response;
}