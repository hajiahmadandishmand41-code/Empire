import type { BrandMeta } from '@/types';

/**
 * Empire Shop — central site configuration.
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
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  // Vercel injects VERCEL_PROJECT_PRODUCTION_URL (stable production domain) and
  // VERCEL_URL (per-deployment domain). Prefer the production domain.
  const runtimeDomain = (
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  )?.trim();
  const raw = configured || (runtimeDomain ? `https://${runtimeDomain}` : '');
  const trimmed = raw.replace(/\/$/, '');

  // Skip strict validation during `next build` (NEXT_PHASE is 'phase-production-build').
  // The URL is only needed at runtime (email links, OG tags) not during static analysis.
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
    if (configured && (!trimmed || trimmed.startsWith('http://localhost'))) {
      throw new Error(
        '[empire] FATAL: NEXT_PUBLIC_SITE_URL must be set to your production domain ' +
          '(e.g. https://www.empire.shop) in production. ' +
          'A localhost fallback is not allowed in production.',
      );
    }
  }

  // Vercel supplies the deployment domain at runtime. Local development falls
  // back to localhost so the app still boots without optional site config.
  return trimmed || 'http://localhost:3000';
}

export const site: BrandMeta = {
  name: 'Empire Shop',
  taglineKey: 'common.tagline',
  legalName: 'Empire Shop LLC',
  baseUrl: resolveSiteUrl(),
} as const;

/** Support / contact email displayed in UI, emails, and footer. */
export const SUPPORT_EMAIL = 'hajiahmads299@gmail.com';

/** Default currency code used across the storefront. */
export const DEFAULT_CURRENCY = 'AFN';

/** Currency symbol shown in UI. */
export const CURRENCY_SYMBOL = '؋';

/**
 * WhatsApp contact configuration.
 */
export const whatsappConfig = {
  enabled: true,
  /** Empire Shop WhatsApp number (digits only, no +). */
  number: '93798228441',
} as const;

/** Build a `wa.me` URL with an optional pre-filled message. */
export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${whatsappConfig.number}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** HSL token map for shadcn primitives (`hsl(var(--token))`). */
export const colorTokens = {
  '--background': '220 20% 97%',    // very light gray-blue
  '--foreground': '220 25% 10%',    // near-black
  '--card': '0 0% 100%',
  '--card-foreground': '220 25% 10%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '220 25% 10%',
  '--primary': '214 85% 40%',       // tech blue
  '--primary-foreground': '0 0% 100%',
  '--secondary': '220 14% 94%',
  '--secondary-foreground': '220 25% 10%',
  '--muted': '220 14% 92%',
  '--muted-foreground': '220 12% 44%',
  '--accent': '3 78% 55%',          // warm red
  '--accent-foreground': '0 0% 100%',
  '--destructive': '0 72% 51%',
  '--destructive-foreground': '0 0% 100%',
  '--border': '220 20% 88%',
  '--input': '220 20% 88%',
  '--ring': '214 85% 40%',
  '--radius': '0.5rem',
} as const;
