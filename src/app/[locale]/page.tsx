import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { HeroSectionI18n } from '@/features/home/components/hero-section-i18n';
import { CategoriesSection } from '@/features/home/components/categories-section';
import { SpecialOffersSection } from '@/features/home/components/special-offers-section';
import { BestSellersSection } from '@/features/home/components/bestsellers-section';
import { NewArrivalsSection } from '@/features/home/components/new-arrivals-section';
import { PopularProductsSection } from '@/features/home/components/popular-products-section';
import { AfghanLocalProductsSection } from '@/features/home/components/afghan-local-products-section';
import { FeaturedProductsSection } from '@/features/home/components/featured-products-section';
import { BecomeSellerBanner } from '@/features/home/components/become-seller-banner';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="min-h-dvh pb-16 md:pb-0">
        {/* UX flow: Header → Hero/Campaigns → Key categories → Offers → Best sellers → New arrivals → Popular → Afghan identity → Featured → Seller CTA */}
        <HeroSectionI18n />
        <Suspense fallback={<div className="h-28 animate-pulse bg-muted/40" />}>
          <CategoriesSection />
        </Suspense>
        <Suspense><SpecialOffersSection /></Suspense>
        <Suspense><BestSellersSection /></Suspense>
        <Suspense><NewArrivalsSection /></Suspense>
        <Suspense><PopularProductsSection /></Suspense>
        <AfghanLocalProductsSection />
        <Suspense><FeaturedProductsSection /></Suspense>
        <BecomeSellerBanner locale={locale} />
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
