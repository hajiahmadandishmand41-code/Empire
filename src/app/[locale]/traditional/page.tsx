import type { Metadata } from 'next';
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { TraditionalPageContent } from '@/features/traditional/components/traditional-page-content';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const title = 'محصولات سنتی افغانستان | Empire Shop';
  const description = 'قالین، زعفران، صنایع دستی، میوه خشک، لباس محلی و سایر محصولات اصیل افغانستان';
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/traditional`,
      languages: {
        fa: `${SITE_URL}/fa/traditional`,
        ps: `${SITE_URL}/ps/traditional`,
        en: `${SITE_URL}/en/traditional`,
      },
    },
    openGraph: { title, description, type: 'website', url: `${SITE_URL}/${locale}/traditional` },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function TraditionalPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh pb-20 md:pb-8 bg-background">
        <Suspense fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-label="در حال بارگذاری..." />
          </div>
        }>
          <TraditionalPageContent locale={locale} />
        </Suspense>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </>
  );
}
