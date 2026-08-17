import { getDirection, htmlLangFor } from '@/lib/direction';
import type { AppLocale } from '@/i18n/routing';
import type { Metadata } from 'next';

export function htmlProps(locale: AppLocale) {
  return { lang: htmlLangFor(locale), dir: getDirection(locale), suppressHydrationWarning: true } as const;
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
const OG_IMAGE = `${SITE_URL}/icons/icon-512.png`;
const OG_LOCALE: Record<AppLocale, string> = { fa: 'fa_AF', ps: 'ps_AF', en: 'en_AF' };

const METADATA_COPY: Record<AppLocale, { title: string; description: string; keywords: string[] }> = {
  fa: {
    title: 'Empire Shop — بزرگ‌ترین فروشگاه آنلاین افغانستان',
    description: 'Empire Shop — فروشگاه اینترنتی افغانستان برای خرید پوشاک، دیجیتال، لوازم خانگی و محصولات اصیل با ارسال سریع و ضمانت اصالت.',
    keywords: ['فروشگاه آنلاین افغانستان', 'خرید اینترنتی', 'پوشاک', 'دیجیتال', 'لوازم خانگی', 'کابل', 'هرات'],
  },
  ps: {
    title: 'Empire Shop — د افغانستان لوی آنلاین پلورنځی',
    description: 'Empire Shop — د افغانستان آنلاین پلورنځی؛ جامې، ډیجیټل توکي، د کور وسایل او اصلي محلي محصولات په چټک لېږد سره.',
    keywords: ['د افغانستان آنلاین پلورنځی', 'آنلاین پیرود', 'جامې', 'ډیجیټل', 'د کور وسایل', 'کابل', 'هرات'],
  },
  en: {
    title: 'Empire Shop — Afghanistan Online Store',
    description: 'Empire Shop is an Afghanistan-focused online store for fashion, digital products, home appliances and authentic local products with reliable delivery.',
    keywords: ['Afghanistan online store', 'online shopping Afghanistan', 'fashion', 'digital products', 'home appliances', 'Kabul', 'Herat'],
  },
};

export function baseMetadata(locale: AppLocale = 'fa'): Metadata {
  const copy = METADATA_COPY[locale];
  const ogLocale = OG_LOCALE[locale];
  const canonicalBase = SITE_URL ? `${SITE_URL}/${locale}` : `/${locale}`;
  return {
    metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
    title: { default: copy.title, template: '%s | Empire Shop' },
    description: copy.description,
    applicationName: 'Empire Shop',
    authors: [{ name: 'Empire Shop', url: SITE_URL }],
    keywords: ['Empire Shop', ...copy.keywords],
    formatDetection: { email: false, address: false, telephone: false },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
    openGraph: {
      type: 'website', siteName: 'Empire Shop', locale: ogLocale,
      alternateLocale: ['fa_AF', 'ps_AF', 'en_AF'].filter((l) => l !== ogLocale),
      url: canonicalBase, title: copy.title, description: copy.description,
      images: [{ url: OG_IMAGE, width: 512, height: 512, alt: 'Empire Shop' }],
    },
    twitter: { card: 'summary', site: '@EmpireShopAF', creator: '@EmpireShopAF', title: copy.title, description: copy.description, images: [OG_IMAGE] },
    icons: {
      icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
      apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
      shortcut: '/favicon-32.png',
    },
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, title: 'Empire Shop', statusBarStyle: 'black-translucent' },
    category: 'shopping',
  };
}

export const pwaViewport = {
  width: 'device-width', initialScale: 1, maximumScale: 5, viewportFit: 'cover' as const,
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#DC1649' }, { media: '(prefers-color-scheme: dark)', color: '#9B1833' }],
};
