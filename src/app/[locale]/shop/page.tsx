import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { ShopPageClient } from '@/features/shop';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'shop' });
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const title = `${t('metaTitle')} | Empire Shop`;
  const description = t('metaDescription');
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/shop`,
      languages: { fa: `${siteUrl}/fa/shop`, ps: `${siteUrl}/ps/shop`, en: `${siteUrl}/en/shop` },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/${locale}/shop`,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ShopPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('shop');
  const tNav = await getTranslations('nav');

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh pb-16 md:pb-0 bg-background">
        <div className="mx-auto max-w-screen-xl px-3 sm:px-6 py-5">
          {/* Breadcrumb */}
          <nav aria-label={t('breadcrumb.label')} className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <a href={`/${locale}`} className="hover:text-primary transition-colors">{tNav('home')}</a>
            <span className="text-border" aria-hidden="true">/</span>
            <span className="font-semibold text-foreground" aria-current="page">{tNav('shop')}</span>
          </nav>

          <ShopPageClient locale={locale} currency="AFN" />
        </div>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </>
  );
}
