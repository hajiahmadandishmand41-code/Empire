import type { BrandMeta } from '@/types';

/**
 * Eshop — central site configuration.
 *
 * All product-level config lives here so there is a single place to change
 * contact details, currency, default locale, and brand identity without
 * touching component code.
 *
 * Production enforcement
 * ──────────────────────
 * `NEXT_PUBLIC_SITE_URL` MUST be set in production. An empty or localhost
 * fallback in production breaks email links, OAuth callbacks, canonical
 * metadata, and sitemap generation. We throw early so the misconfiguration
 * is caught at startup rather than manifesting as silent broken links.
 */

function resolveSiteUrl(): string {
  // `NEXT_PUBLIC_*` values are inlined into bundles at build time, so a
  // container built without them cannot be reconfigured at start. `SITE_URL`
  // is a plain runtime variable: it is evaluated when the server boots and is
  // `undefined` inside client bundles, where the baked NEXT_PUBLIC value (or
  // nothing) is used instead.
  const runtimeOverride = process.env.SITE_URL?.trim();
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const runtimeDomain = (
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  )?.trim();
  const raw =
    runtimeOverride || configured || (runtimeDomain ? `https://${runtimeDomain}` : '');
  const trimmed = raw.replace(/\/$/, '');
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
    if (
      !trimmed ||
      trimmed.startsWith('http://localhost') ||
      trimmed.startsWith('http://127.0.0.1')
    ) {
      throw new Error(
        '[eshop] FATAL: the production site URL is not configured. Set SITE_URL ' +
          '(runtime) or NEXT_PUBLIC_SITE_URL (build time) to your production ' +
          'domain (e.g. https://www.eshop.shop). A localhost fallback is not ' +
          'allowed in production.',
      );
    }
  }
  return trimmed || 'http://localhost:3000';
}

export const site: BrandMeta = {
  name: 'Eshop',
  taglineKey: 'common.tagline',
  legalName: 'Eshop',
  baseUrl: resolveSiteUrl(),
} as const;

export const SUPPORT_EMAIL = 'hajiahmads299@gmail.com';
export const DEFAULT_CURRENCY = 'AFN';
export const CURRENCY_SYMBOL = '؋';

export const whatsappConfig = {
  enabled: true,
  number: '93798228441',
} as const;

export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${whatsappConfig.number}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export const colorTokens = {
  '--background': '220 20% 97%',
  '--foreground': '220 25% 10%',
  '--card': '0 0% 100%',
  '--card-foreground': '220 25% 10%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '220 25% 10%',
  '--primary': '214 85% 40%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '220 14% 94%',
  '--secondary-foreground': '220 25% 10%',
  '--muted': '220 14% 92%',
  '--muted-foreground': '220 12% 44%',
  '--accent': '3 78% 55%',
  '--accent-foreground': '0 0% 100%',
  '--destructive': '0 72% 51%',
  '--destructive-foreground': '0 0% 100%',
  '--border': '220 20% 88%',
  '--input': '220 20% 88%',
  '--ring': '214 85% 40%',
  '--radius': '0.5rem',
} as const;
