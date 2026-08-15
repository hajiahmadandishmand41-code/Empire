import { getDirection, htmlLangFor } from '@/lib/direction';
import type { AppLocale } from '@/i18n/routing';
import type { Metadata } from 'next';

/**
 * Helper that returns props to spread onto the `<html>` element in a layout.
 *
 * Usage in `app/[locale]/layout.tsx`:
 *   return (
 *     <html {...htmlProps(locale)}>
 *       <body>...</body>
 *     </html>
 *   );
 */
export function htmlProps(locale: AppLocale) {
  return {
    lang: htmlLangFor(locale),
    dir: getDirection(locale),
    suppressHydrationWarning: true,
  } as const;
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
const OG_IMAGE = `${SITE_URL}/icons/icon-512.png`;

/** Locale-aware Open Graph locale codes */
const OG_LOCALE: Record<AppLocale, string> = {
  fa: 'fa_AF',
  ps: 'ps_AF',
  en: 'en_AF',
};

/**
 * Build base metadata once, then per-locale pages can extend via `generateMetadata`.
 * Stage 5: added full OpenGraph, Twitter Cards, and hreflang support.
 */
export function baseMetadata(locale?: AppLocale): Metadata {
  const ogLocale = locale ? OG_LOCALE[locale] : 'fa_AF';
  const canonicalBase = locale ? `${SITE_URL}/${locale}` : SITE_URL;

  return {
    metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
    title: {
      default: 'Empire Shop — بزرگ‌ترین فروشگاه آنلاین افغانستان',
      template: '%s | Empire Shop',
    },
    description:
      'Empire Shop — بزرگ‌ترین فروشگاه اینترنتی افغانستان. خرید آنلاین پوشاک، دیجیتال، خانگی با ارسال سریع و ضمانت اصالت. Online shopping in Afghanistan — Dari, Pashto, English.',
    applicationName: 'Empire Shop',
    authors: [{ name: 'Empire Shop', url: SITE_URL }],
    keywords: [
      'Empire Shop',
      'فروشگاه آنلاین افغانستان',
      'خرید اینترنتی',
      'Afghanistan e-commerce',
      'Kabul online store',
      'دری',
      'پشتو',
      'کابل',
      'Herat',
      'Mazar-i-Sharif',
    ],
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Empire Shop',
      locale: ogLocale,
      alternateLocale: ['fa_AF', 'ps_AF', 'en_AF'].filter((l) => l !== ogLocale),
      url: canonicalBase,
      title: 'Empire Shop — بزرگ‌ترین فروشگاه آنلاین افغانستان',
      description:
        'خرید آنلاین پوشاک، دیجیتال، خانگی با ارسال سریع و ضمانت اصالت — افغانستان',
      images: [
        {
          url: OG_IMAGE,
          width: 512,
          height: 512,
          alt: 'Empire Shop',
        },
      ],
    },
    twitter: {
      card: 'summary',
      site: '@EmpireShopAF',
      creator: '@EmpireShopAF',
      title: 'Empire Shop — بزرگ‌ترین فروشگاه آنلاین افغانستان',
      description:
        'خرید آنلاین پوشاک، دیجیتال، خانگی با ارسال سریع — افغانستان',
      images: [OG_IMAGE],
    },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
      shortcut: '/favicon-32.png',
    },
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      title: 'Empire Shop',
      statusBarStyle: 'black-translucent',
    },
    category: 'shopping',
  };
}

/**
 * Next.js 14+ requires viewport + themeColor in a separate `viewport` export,
 * not inside `metadata`. Re-export from route layouts as `export const viewport = pwaViewport;`
 */
export const pwaViewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover' as const,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#DC1649' },
    { media: '(prefers-color-scheme: dark)', color: '#9B1833' },
  ],
};
