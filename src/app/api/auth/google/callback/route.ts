import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';
import { createMockUser, findMockUser } from '@/lib/auth/mock-users';
import { routing } from '@/i18n/routing';
import {
  GOOGLE_STATE_COOKIE,
  googleClientId,
  googleClientSecret,
  googleConfigured,
  googleRedirectUri,
  requestOrigin,
  verifyGoogleState,
} from '@/lib/auth/google';

export const dynamic = 'force-dynamic';

interface GoogleTokenResponse {
  access_token?: string;
}

interface GoogleProfile {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

function loginUrl(req: NextRequest, locale: string, error?: string): URL {
  const url = new URL(`/${locale}/auth/login`, req.url);
  if (error) url.searchParams.set('error', error);
  return url;
}

export async function GET(req: NextRequest) {
  const cookieState = req.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const stateParam = req.nextUrl.searchParams.get('state') ?? '';
  const state = verifyGoogleState(stateParam, cookieState);
  const locale = state && (routing.locales as readonly string[]).includes(state.locale)
    ? state.locale
    : routing.defaultLocale;
  const responseForError = (error: string) => {
    const url = loginUrl(req, locale, error);
    if (state?.redirect) url.searchParams.set('redirect', state.redirect);
    const response = NextResponse.redirect(url);
    response.cookies.delete(GOOGLE_STATE_COOKIE);
    return response;
  };

  if (!state || !googleConfigured()) return responseForError('google_auth_failed');
  if (req.nextUrl.searchParams.get('error')) return responseForError('google_access_denied');

  const code = req.nextUrl.searchParams.get('code');
  if (!code) return responseForError('google_auth_failed');

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId()!,
        client_secret: googleClientSecret()!,
        redirect_uri: googleRedirectUri(requestOrigin(req)),
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
    });
    if (!tokenResponse.ok) return responseForError('google_auth_failed');
    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokens.access_token) return responseForError('google_auth_failed');

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: 'no-store',
    });
    if (!profileResponse.ok) return responseForError('google_auth_failed');
    const profile = (await profileResponse.json()) as GoogleProfile;
    if (!profile.sub || !profile.email || profile.email_verified !== true) {
      return responseForError('google_email_unverified');
    }

    let userId: string;
    const email = profile.email.toLowerCase();
    if (!isDatabaseConfigured()) {
      const existing = await findMockUser({ email });
      if (existing) {
        userId = existing.id;
      } else {
        const created = await createMockUser({
          fullName: profile.name?.trim() || email.split('@')[0],
          email,
          phone: null,
          password: `google:${profile.sub}:${crypto.randomUUID()}`,
        });
        userId = created.id;
      }
    } else {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        userId = existing.id;
        if (!existing.emailVerified) {
          await prisma.user.update({ where: { id: existing.id }, data: { emailVerified: true } });
        }
      } else {
        const created = await prisma.user.create({
          data: {
            email,
            fullName: profile.name?.trim() || email.split('@')[0],
            passwordHash: await hashPassword(`google:${profile.sub}:${crypto.randomUUID()}`),
            emailVerified: true,
          },
        });
        userId = created.id;
      }
    }

    const target = state.redirect && state.redirect.startsWith('/') && !state.redirect.startsWith('//') ? state.redirect : `/${locale}`;
    const response = NextResponse.redirect(new URL(target, req.url));
    response.cookies.delete(GOOGLE_STATE_COOKIE);
    await setSessionCookie(userId);
    return response;
  } catch {
    return responseForError('google_auth_failed');
  }
}