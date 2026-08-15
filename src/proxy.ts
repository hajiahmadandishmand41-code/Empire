import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { securityHeaders } from '@/lib/security/headers';
import { rateLimitAsync, clientKey } from '@/lib/api/rate-limit';

const intlMiddleware = createIntlMiddleware(routing);
const PROTECTED_SEGMENTS = ['/profile', '/admin', '/seller'] as const;
const SESSION_COOKIE = 'empire_session';
const API_RATE_LIMIT = Number(process.env.API_RATE_LIMIT ?? 300);
const API_RATE_WINDOW_MS = Number(process.env.API_RATE_WINDOW_MS ?? 60_000);

function stripLocale(pathname: string): { locale: string | null; rest: string } {
  const parts = pathname.split('/').filter(Boolean);
  const maybeLocale = parts[0];
  if (maybeLocale && (routing.locales as readonly string[]).includes(maybeLocale)) {
    return { locale: maybeLocale, rest: '/' + parts.slice(1).join('/') };
  }
  return { locale: null, rest: pathname };
}

function isProtected(rest: string): boolean {
  return PROTECTED_SEGMENTS.some((seg) => rest === seg || rest.startsWith(seg + '/'));
}

function withSecurityHeaders(res: NextResponse, nonce?: string): NextResponse {
  const headers = securityHeaders({ nonce });
  for (const [key, value] of Object.entries(headers)) res.headers.set(key, value);
  return res;
}

function makeNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function sameOriginRequest(req: NextRequest): boolean {
  const forwardedHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const forwardedProto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '');
  const requestOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`
    : req.nextUrl.origin;
  const origin = req.headers.get('origin');
  if (origin) return origin === requestOrigin;
  const referer = req.headers.get('referer');
  if (!referer) return false;
  try {
    return new URL(referer).origin === requestOrigin;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const nonce = makeNonce();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);

  // Next.js reads the CSP nonce from the incoming request while rendering the
  // App Router. Sending CSP only on the response is too late: the browser gets
  // a strict nonce-based policy, but Next cannot attach that nonce to its
  // framework/Flight scripts. That leaves the SSR splash mounted forever when
  // the browser correctly blocks those scripts under CSP.
  const csp = securityHeaders({ nonce })['Content-Security-Policy'];
  requestHeaders.set('Content-Security-Policy', csp);

  if (pathname.startsWith('/api/')) {
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
      pathname !== '/api/payments/callback' &&
      !sameOriginRequest(req)
    ) {
      return withSecurityHeaders(
        NextResponse.json(
          { ok: false, error: { code: 'csrf_rejected', message: 'Request origin could not be verified' } },
          { status: 403 },
        ),
        nonce,
      );
    }
    const rl = await rateLimitAsync(clientKey(req, 'api:global'), {
      limit: API_RATE_LIMIT,
      windowMs: API_RATE_WINDOW_MS,
    });
    if (!rl.ok) {
      const res = NextResponse.json(
        { ok: false, error: { code: 'rate_limited', message: 'Too many requests' },
        { status: 429 },
      );
      res.headers.set('Retry-After', Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000)).toString());
      res.headers.set('X-RateLimit-Limit', String(API_RATE_LIMIT));
      res.headers.set('X-RateLimit-Remaining', '0');
      return withSecurityHeaders(res, nonce);
    }
    const passthrough = NextResponse.next({ request: { headers: requestHeaders } });
    passthrough.headers.set('X-RateLimit-Limit', String(API_RATE_LIMIT));
    passthrough.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    return withSecurityHeaders(passthrough, nonce);
  }

  const { locale, rest } = stripLocale(pathname);
  if (isProtected(rest) && !req.cookies.get(SESSION_COOKIE)?.value) {
    const target = req.nextUrl.clone();
    target.pathname = `/${locale ?? routing.defaultLocale}/auth/login`;
    target.search = search ? `${search}&redirect=${encodeURIComponent(rest)}` : `?redirect=${encodeURIComponent(rest)}`;
    return withSecurityHeaders(NextResponse.redirect(target), nonce);
  }

  const intlReq = new NextRequest(req.url, { headers: requestHeaders, method: req.method });
  const intlRes = intlMiddleware(intlReq);
  intlRes.headers.set('x-nonce', nonce);
  return withSecurityHeaders(intlRes, nonce);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
