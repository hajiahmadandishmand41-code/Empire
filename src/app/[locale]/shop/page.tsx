import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { ShopPageClient } from '@/features/shop';
import { ShopHotProducts } from '@/features/shop/components/shop-hot-products';

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'shop' });
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const title = `${t('metaTitle')} | Eshop`;
  const description = t('metaDescription');
  return { title, description, alternates: { canonical: `${siteUrl}/${locale}/shop`, languages: { fa: `${siteUrl}/fa/shop`, ps: `${siteUrl}/ps/shop`, en: `${siteUrl}/en/shop` } }, openGraph: { title, description, type: 'website', url: `${siteUrl}/${locale}/shop`, siteName: 'Eshop' }, twitter: { card: 'summary_large_image', title, description } };
}

export default async function ShopPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('shop');
  const tNav = await getTranslations('nav');
  const safeLocale = (['fa', 'ps', 'en'].includes(locale) ? locale : 'fa') as 'fa' | 'ps' | 'en';
  return <><SiteHeader /><main id="main" className="min-h-dvh bg-background pb-16 md:pb-0"><div className="mx-auto max-w-screen-xl px-2 py-5 sm:px-6"><nav aria-label={t('breadcrumb.label')} className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground"><a href={`/${locale}`} className="transition-colors hover:text-primary">{tNav('home')}</a><span className="text-border" aria-hidden="true">/</span><span className="font-semibold text-foreground" aria-current="page">{tNav('shop')}</span></nav><ShopPageClient locale={locale} currency="AFN" /></div><ShopHotProducts locale={safeLocale} /></main><SiteFooter /><BottomNavigation /></>;
}
