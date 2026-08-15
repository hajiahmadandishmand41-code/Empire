/**
 * CORS response headers — Stage 3 hardened.
 *
 * Restricts Access-Control-Allow-Origin to the configured app URL
 * (NEXT_PUBLIC_APP_URL) instead of blindly reflecting any incoming Origin.
 * Blindly reflecting any origin while setting Allow-Credentials: true allows
 * any website to make credentialed cross-origin requests and read the response,
 * defeating cookie-based session security.
 *
 * Behaviour:
 *  - If the request Origin matches the configured app URL → reflect it.
 *  - If no Origin header is present (same-origin browser requests, curl) → no ACAO.
 *  - If Origin does not match → no ACAO header (browser will block the read).
 */

const ALLOWED_ORIGIN =
  (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

export function corsHeaders(req?: Request): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
  headers.set('Access-Control-Allow-Credentials', 'true');

  const origin = req?.headers.get('origin');
  if (origin) {
    // In development (or when ALLOWED_ORIGIN is not configured), reflect any
    // origin so the dev server / Next.js dev tools keep working.
    const isDev = process.env.NODE_ENV !== 'production';
    const isAllowed = isDev || !ALLOWED_ORIGIN || origin === ALLOWED_ORIGIN;
    if (isAllowed) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
  }

  return headers;
}
