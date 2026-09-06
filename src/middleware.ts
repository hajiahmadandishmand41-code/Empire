import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

/**
 * next-intl middleware — handles locale negotiation, redirects, and prefixing.
 *
 * With `localePrefix: 'always'` every URL carries a locale segment (/fa, /ps, /en).
 * The middleware:
 *  1. Redirects `/` → `/<defaultLocale>` (fa).
 *  2. Detects the best locale from `Accept-Language` when no prefix is present.
 *  3. Passes through already-prefixed URLs to the page handlers.
 */
export default createMiddleware(routing);

export const config = {
  // Match every path except static assets, API routes, and Next.js internals.
  matcher: ['/((?!api|_next|_vercel|icons|fonts|favicon|manifest|.*\\..*).*)'],
};
