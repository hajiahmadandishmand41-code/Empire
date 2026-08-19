import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { HomepageHeroCarousel } from '@/features/home/components/homepage-hero-carousel';
import { CategoriesSection } from '@/features/home/components/categories-section';
import { SpecialOffersSection } from '@/features/home/components/special-offers-section';
import { BestSellersSection } from '@/features/home/components/bestsellers-section';
import { NewArrivalsSection } from '@/features/home/components/new-arrivals-section';
import { AfghanLocalProductsSection } from '@/features/home/components/afghan-local-products-section';
import { BecomeSellerBanner } from '@/features/home/components/become-seller-banner';
import { TrustSection } from '@/features/home/components/trust-section';
import { PersonalizedProductsSection } from '@/features/home/components/personalized-products-section';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { getHomepageData, getHeroProducts, toSliderProduct } from '@/features/home/lib/homepage-data';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [heroProducts, homepageData] = await Promise.all([getHeroProducts(), getHomepageData()]);

  const recommendationCandidates = [
    ...homepageData.popular,
    ...homepageData.featured,
    ...homepageData.bestSelling,
    ...homepageData.newest,
  ]
    .filter((product, index, all) => all.findIndex((item) => item.id === product.id) === index)
    .slice(0, 16)
    .map((product) => toSliderProduct(product));

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="min-h-dvh pb-16 md:pb-0">
        {/* Premium conversion flow: Header → Hero → Categories → Offers → Best sellers → Personalized → New → Afghan identity → Seller → Trust. */}
        <HomepageHeroCarousel products={heroProducts} locale={locale} currency="AFN" />
        <Suspense fallback={<div className="h-28 animate-pulse bg-muted/40" />}>
          <CategoriesSection />
        </Suspense>
        <Suspense><SpecialOffersSection /></Suspense>
        <Suspense><BestSellersSection /></Suspense>
        <PersonalizedProductsSection products={recommendationCandidates} locale={locale} currency="AFN" />
        <Suspense><NewArrivalsSection /></Suspense>
        <AfghanLocalProductsSection />
        <BecomeSellerBanner locale={locale} />
        <Suspense><TrustSection /></Suspense>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
