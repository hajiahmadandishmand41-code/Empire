import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { HeroSection } from '@/features/home/components/hero-section';
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

/** Shared skeleton for product slider sections while they stream in */
function ProductSliderSkeleton() {
  return (
    <div className="bg-background border-b border-border py-6 sm:py-8" aria-hidden>
      <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
        {/* Header skeleton */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-5 w-1 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-4 w-36 rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-20 rounded-lg bg-muted animate-pulse" />
        </div>
        {/* Cards skeleton */}
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-[160px] flex-none sm:w-[180px] md:w-[200px] flex flex-col overflow-hidden rounded-xl border border-border bg-card animate-pulse"
            >
              <div className="aspect-square bg-muted" />
              <div className="flex flex-col gap-2 p-3">
                <div className="h-2.5 w-16 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
                <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
                  <div className="h-4 w-16 rounded bg-muted" />
                  <div className="h-7 w-14 rounded-lg bg-muted" />
                </div>
              </div>
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
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh pb-16 md:pb-0 bg-background">
        {/* Hero - critical, no suspense */}
        <HeroSection />

        {/* Categories - fast static data */}
        <Suspense fallback={
          <div className="py-6 sm:py-8 border-b border-border bg-muted/40">
            <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
              <div className="flex gap-2.5 overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-[90px] flex-none">
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 animate-pulse">
                      <div className="h-12 w-12 rounded-xl bg-muted" />
                      <div className="h-3 w-12 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }>
          <CategoriesSection />
        </Suspense>

        {/* Afghan Local Products — compact animated banner linking to dedicated page */}
        <LocalProductsHomeBanner />

        {/* Special Offers */}
        <Suspense fallback={<ProductSliderSkeleton />}>
          <SpecialOffersSection />
        </Suspense>

        {/* Featured Products */}
        <Suspense fallback={<ProductSliderSkeleton />}>
          <FeaturedProductsSection />
        </Suspense>

        {/* New Products */}
        <Suspense fallback={<ProductSliderSkeleton />}>
          <NewProductsSection />
        </Suspense>

        {/* Best Sellers */}
        <Suspense fallback={<ProductSliderSkeleton />}>
          <BestSellersSection />
        </Suspense>

        {/* Popular Products */}
        <Suspense fallback={<ProductSliderSkeleton />}>
          <PopularProductsSection />
        </Suspense>

        {/* Most Viewed */}
        <Suspense fallback={<ProductSliderSkeleton />}>
          <MostViewedSection />
        </Suspense>

        {/* Trust & Why Us */}
        <TrustSection />

        {/* Seller CTA */}
        <CallToActionSection />
      </main>
      <SiteFooter />
      <BottomNavigation />
    </>
  );
}
