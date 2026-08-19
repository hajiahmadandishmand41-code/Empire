import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { HomepageHeroCarousel } from '@/features/home/components/homepage-hero-carousel';
import { DynamicBannerStrip } from '@/features/home/components/dynamic-banner-strip';
import { CategoriesSection } from '@/features/home/components/categories-section';
import { ProductSliderSection } from '@/features/home/components/product-slider-section';
import { PersonalizedProductsSection, RecentlyViewedSection } from '@/features/home/components/personalized-products-section';
import { BecomeSellerBanner } from '@/features/home/components/become-seller-banner';
import { TrustSection } from '@/features/home/components/trust-section';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { getHomepageData, toSliderProduct } from '@/features/home/lib/homepage-data';
import { listActiveBanners } from '@/server/services/banner.service';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [homepageData, heroBanners] = await Promise.all([
    getHomepageData(),
    listActiveBanners('HOME_HERO', 6),
  ]);

  const newest = homepageData.newest.map((product) => toSliderProduct(product, 'new'));
  const bestSelling = homepageData.bestSelling.map((product) => toSliderProduct(product, 'best'));
  const popular = homepageData.popular.map((product) => toSliderProduct(product, 'popular'));
  const featured = homepageData.featured.map((product) => toSliderProduct(product, 'featured'));
  const recentPool = [...featured, ...popular, ...bestSelling, ...newest];

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="min-h-dvh pb-16 md:pb-0">
        <HomepageHeroCarousel banners={heroBanners} locale={locale} />

        <Suspense fallback={<div className="h-24 animate-pulse bg-muted/40" />}>
          <CategoriesSection />
        </Suspense>

        <ProductSliderSection
          title={locale === 'en' ? 'Special offers' : locale === 'ps' ? 'ځانګړي وړاندیزونه' : 'پیشنهادهای ویژه'}
          subtitle={locale === 'en' ? 'Limited-time products worth checking today' : locale === 'ps' ? 'د نن ورځې محدود او ارزښتناک وړاندیزونه' : 'محصولات محدود و ارزشمند امروز'}
          viewAllHref="/shop?badge=sale"
          products={featured}
          locale={locale}
        />

        <ProductSliderSection
          title={locale === 'en' ? 'Best sellers' : locale === 'ps' ? 'تر ټولو ډېر پلورل شوي' : 'پرفروش‌ترین‌ها'}
          viewAllHref="/shop?sort=bestSelling"
          products={bestSelling}
          locale={locale}
          accentColor="bg-amber-500"
        />

        <DynamicBannerStrip locale={locale} placement="HOME_PROMO_1" />

        <ProductSliderSection
          title={locale === 'en' ? 'New arrivals' : locale === 'ps' ? 'نوي محصولات' : 'جدیدترین‌ها'}
          viewAllHref="/shop?sort=newest"
          products={newest}
          locale={locale}
          accentColor="bg-sky-500"
        />

        <ProductSliderSection
          title={locale === 'en' ? 'Popular products' : locale === 'ps' ? 'مشهور محصولات' : 'محبوب‌ترین محصولات'}
          viewAllHref="/shop?sort=popular"
          products={popular}
          locale={locale}
          accentColor="bg-fuchsia-500"
        />

        <DynamicBannerStrip locale={locale} placement="HOME_PROMO_2" />

        <PersonalizedProductsSection products={recentPool} locale={locale} />
        <RecentlyViewedSection products={recentPool} locale={locale} />

        <DynamicBannerStrip locale={locale} placement="HOME_MID" />
        <BecomeSellerBanner locale={locale} />
        <Suspense><TrustSection /></Suspense>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
