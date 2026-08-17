import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { HeroSectionI18n } from '@/features/home/components/hero-section-i18n';
import { CategoriesSection } from '@/features/home/components/categories-section';
import { FeaturedProductsSection } from '@/features/home/components/featured-products-section';
import { NewProductsSection } from '@/features/home/components/new-products-section';
import { BestSellersSection } from '@/features/home/components/bestsellers-section';
import { MostViewedSection } from '@/features/home/components/most-viewed-section';
import { PopularProductsSection } from '@/features/home/components/popular-products-section';
import { SpecialOffersSection } from '@/features/home/components/special-offers-section';
import { LocalProductsHomeBanner } from '@/features/home/components/local-products-home-banner';
import { TrustSection } from '@/features/home/components/trust-section';
import { CallToActionSection } from '@/features/home/components/call-to-action-section';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';

function ProductSliderSkeleton() {
  return (
    <div className="border-b border-border bg-background py-7 sm:py-9" aria-hidden>
      <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-1 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1.5"><div className="h-4 w-36 rounded bg-muted animate-pulse" /><div className="h-3 w-24 rounded bg-muted animate-pulse" /></div>
          </div>
          <div className="h-8 w-20 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex w-[160px] flex-none flex-col overflow-hidden rounded-xl border border-border bg-card animate-pulse sm:w-[180px] md:w-[200px]">
              <div className="aspect-square bg-muted" />
              <div className="flex flex-col gap-2 p-3"><div className="h-2.5 w-16 rounded bg-muted" /><div className="h-3 w-full rounded bg-muted" /><div className="h-3 w-3/4 rounded bg-muted" /><div className="mt-1 flex items-center justify-between border-t border-border pt-2"><div className="h-4 w-16 rounded bg-muted" /><div className="h-7 w-14 rounded-lg bg-muted" /></div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background via-muted/20 to-background">
      <SiteHeader />
      <main id="main" className="min-h-dvh pb-16 md:pb-0">
        <HeroSectionI18n />
        <Suspense fallback={<div className="h-28 animate-pulse bg-muted/40" />}><CategoriesSection /></Suspense>
        <LocalProductsHomeBanner />
        <Suspense fallback={<ProductSliderSkeleton />}><SpecialOffersSection /></Suspense>
        <Suspense fallback={<ProductSliderSkeleton />}><FeaturedProductsSection /></Suspense>
        <Suspense fallback={<ProductSliderSkeleton />}><NewProductsSection /></Suspense>
        <Suspense fallback={<ProductSliderSkeleton />}><BestSellersSection /></Suspense>
        <Suspense fallback={<ProductSliderSkeleton />}><PopularProductsSection /></Suspense>
        <Suspense fallback={<ProductSliderSkeleton />}><MostViewedSection /></Suspense>
        <TrustSection />
        <CallToActionSection />
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
