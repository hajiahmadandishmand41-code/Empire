import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const GOOGLE_STATE_COOKIE = 'empire_google_oauth_state';
const STATE_MAX_AGE_SECONDS = 10 * 60;

interface GoogleState {
  nonce: string;
  locale: string;
  exp: number;
  redirect?: string;
}

function authSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET or SESSION_SECRET must be configured for Google OAuth.');
    }
    return 'dev-insecure-secret-change-me-please-32b';
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', authSecret()).update(payload).digest('base64url');
}

function encode(value: GoogleState): string {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function createGoogleState(locale: string, redirect?: string): string {
  const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : undefined;
  return encode({
    nonce: randomBytes(24).toString('base64url'),
    locale,
    exp: Math.floor(Date.now() / 1000) + STATE_MAX_AGE_SECONDS,
    redirect: safeRedirect,
  });
}

export function verifyGoogleState(value: string, expected: string | undefined): GoogleState | null {
  if (!expected || value !== expected) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const actual = Buffer.from(signature);
  const expectedSignature = Buffer.from(sign(payload));
  if (
    actual.length !== expectedSignature.length ||
    !timingSafeEqual(actual, expectedSignature)
  ) {
    return null;
  }
  try {
    const state = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as GoogleState;
    if (!state.nonce || !state.locale || !state.exp || state.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export function googleClientId(): string | null {
  return process.env.GOOGLE_CLIENT_ID || null;
}

export function googleClientSecret(): string | null {
  return process.env.GOOGLE_CLIENT_SECRET || null;
}

export function googleRedirectUri(origin: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, '');
  return `${base}/api/auth/google/callback`;
}

export function requestOrigin(req: Request): string {
  const forwardedHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const forwardedProto = req.headers.get('x-forwarded-proto') ?? 'https';
  if (forwardedHost) {
    return `${forwardedProto.split(',')[0].trim()}://${forwardedHost.split(',')[0].trim()}`;
  }
  return new URL(req.url).origin;
}

export function googleConfigured(): boolean {
  return Boolean(googleClientId() && googleClientSecret());
}

export const GOOGLE_STATE_MAX_AGE_SECONDS = STATE_MAX_AGE_SECONDS;