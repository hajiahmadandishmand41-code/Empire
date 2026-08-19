import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { HomepageHeroCarousel } from '@/features/home/components/homepage-hero-carousel';
import { DynamicBannerStrip } from '@/features/home/components/dynamic-banner-strip';
import { CategoriesSection } from '@/features/home/components/categories-section';
import { SpecialOffersSection } from '@/features/home/components/special-offers-section';
import { BestSellersSection } from '@/features/home/components/bestsellers-section';
import { NewArrivalsSection } from '@/features/home/components/new-arrivals-section';
import { BecomeSellerBanner } from '@/features/home/components/become-seller-banner';
import { TrustSection } from '@/features/home/components/trust-section';
import { TraditionalHomeBanner } from '@/features/traditional/components/traditional-home-banner';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { getHeroProducts } from '@/features/home/lib/homepage-data';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const heroProducts = await getHeroProducts();

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="min-h-dvh pb-16 md:pb-0">
        <HomepageHeroCarousel products={heroProducts} locale={locale} currency="AFN" />
        <DynamicBannerStrip locale={locale} placement="hero" />
        <TraditionalHomeBanner locale={locale} />
        <Suspense fallback={<div className="h-24 animate-pulse bg-muted/40" />}>
          <CategoriesSection />
        </Suspense>
        <Suspense><SpecialOffersSection /></Suspense>
        <DynamicBannerStrip locale={locale} placement="mid" />
        <Suspense><BestSellersSection /></Suspense>
        <Suspense><NewArrivalsSection /></Suspense>
        <DynamicBannerStrip locale={locale} placement="campaign" />
        <BecomeSellerBanner locale={locale} />
        <Suspense><TrustSection /></Suspense>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
