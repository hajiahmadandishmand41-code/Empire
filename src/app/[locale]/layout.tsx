import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type AppLocale } from '@/i18n/routing';
import { Toaster } from '@/components/ui/toast';
import { DirectionProvider } from '@/components/providers/direction-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { baseMetadata, htmlProps, pwaViewport } from '@/components/providers/locale-html-attrs';
import { PWAProvider } from '@/components/pwa/pwa-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { vazirmatn, inter } from '@/lib/fonts';
import '@/styles/globals.css';
import '@/styles/shop-overrides.css';

export const dynamic = 'force-dynamic';
export const viewport = pwaViewport;

interface LocaleLayoutProps { children: ReactNode; params: Promise<{ locale: string }>; }

export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  return { ...(await baseMetadata(locale as AppLocale)), alternates: { canonical: `${siteUrl}/${locale}`, languages: Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}/${l}`])) } };
}

const ANTI_FLICKER_SCRIPT = `(function(){try{var t=localStorage.getItem('empire-theme')||'light';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light');}})();`;

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) notFound();
  setRequestLocale(locale);
  const requestHeaders = await headers();
  const nonce = requestHeaders.get('x-nonce') ?? undefined;
  const [messages, t] = await Promise.all([getMessages(), getTranslations('common')]);
  return <html {...htmlProps(locale as AppLocale)} className={`${vazirmatn.variable} ${inter.variable}`}><head><script nonce={nonce} dangerouslySetInnerHTML={{ __html: ANTI_FLICKER_SCRIPT }} /></head><body className="bg-background font-sans text-foreground"><NextIntlClientProvider locale={locale} messages={messages}><ThemeProvider><DirectionProvider locale={locale as AppLocale}><AuthProvider><a href="#main" className="skip-link">{t('skipToContent')}</a>{children}<PWAProvider /><Toaster /></AuthProvider></DirectionProvider></ThemeProvider></NextIntlClientProvider></body></html>;
}
