import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type AppLocale } from '@/i18n/routing';
import { Toaster } from '@/components/ui/toast';
import { DirectionProvider } from '@/components/providers/direction-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { baseMetadata, htmlProps, pwaViewport } from '@/components/providers/locale-html-attrs';
import { PWAProvider } from '@/components/pwa/pwa-provider';
import { vazirmatn, inter } from '@/lib/fonts';
import '@/styles/globals.css';

// The CSP nonce is generated per request in proxy.ts. Locale documents must
// therefore be rendered dynamically so Next can attach that request nonce to
// its inline/framework scripts instead of serving a prerendered HTML document
// with nonce-less scripts under a nonce-based CSP.
export const dynamic = 'force-dynamic';

export const viewport = pwaViewport;

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  return {
    ...baseMetadata(locale as AppLocale),
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${siteUrl}/${l}`]),
      ),
    },
  };
}

/**
 * Anti-flicker inline script — runs synchronously before first paint.
 * Reads 'empire-theme' from localStorage and applies the 'dark' class
 * to <html> immediately, preventing a white flash in dark mode.
 *
 * Must stay as a plain string (no JSX transformation) to be injected as
 * a raw <script> tag in the document head.
 */
const ANTI_FLICKER_SCRIPT = `(function(){try{var t=localStorage.getItem('empire-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList[d?'add':'remove']('dark');document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }

  setRequestLocale(locale);

  const [messages, t] = await Promise.all([getMessages(), getTranslations('common')]);

  return (
    <html
      {...htmlProps(locale as AppLocale)}
      className={`${vazirmatn.variable} ${inter.variable}`}
    >
      {/*
        Anti-flicker script: applied synchronously before body renders.
        suppressHydrationWarning is set on <html> via htmlProps() already.
      */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLICKER_SCRIPT }} />
      </head>
      <body className="font-sans bg-background text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <DirectionProvider locale={locale as AppLocale}>
              {/* Skip-to-content link: visually hidden until focused, required for keyboard nav */}
              <a href="#main" className="skip-link">
                {t('skipToContent')}
              </a>
              {children}
              <PWAProvider />
              <Toaster />
            </DirectionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
