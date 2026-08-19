import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { HeroSectionI18n } from '@/features/home/components/hero-section-i18n';
import { HomepageHeroCarousel } from '@/features/home/components/homepage-hero-carousel';
import { CategoriesSection } from '@/features/home/components/categories-section';
import { SpecialOffersSection } from '@/features/home/components/special-offers-section';
import { FeaturedProductsSection } from '@/features/home/components/featured-products-section';
import { LocalProductsHomeBanner } from '@/features/home/components/local-products-home-banner';
import { BecomeSellerBanner } from '@/features/home/components/become-seller-banner';
import { TrustSection } from '@/features/home/components/trust-section';
import { CallToActionSection } from '@/features/home/components/call-to-action-section';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { getHeroProducts } from '@/features/home/lib/homepage-data';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const heroProducts = await getHeroProducts();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background via-muted/20 to-background">
      <SiteHeader />
      <main id="main" className="min-h-dvh pb-16 md:pb-0">
        <HeroSectionI18n />
        <HomepageHeroCarousel products={heroProducts} locale={locale} currency="AFN" />
        <Suspense fallback={<div className="h-28 animate-pulse bg-muted/40" />}><CategoriesSection /></Suspense>
        <LocalProductsHomeBanner />
        <Suspense><SpecialOffersSection /></Suspense>
        <Suspense><FeaturedProductsSection /></Suspense>
        <BecomeSellerBanner locale={locale} />
        <TrustSection />
        <CallToActionSection />
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
