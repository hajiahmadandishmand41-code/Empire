import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { LayoutGrid, Store, Sparkles } from 'lucide-react';
import { HomepageHeroCarousel } from '@/features/home/components/homepage-hero-carousel';
import { DynamicBannerStrip } from '@/features/home/components/dynamic-banner-strip';
import { TraditionalProductsBanner } from '@/features/home/components/traditional-products-banner';
import { CategoriesSection } from '@/features/home/components/categories-section';
import { ProductSliderSection } from '@/features/home/components/product-slider-section';
import { PersonalizedProductsSection, RecentlyViewedSection } from '@/features/home/components/personalized-products-section';
import { BecomeSellerBanner } from '@/features/home/components/become-seller-banner';
import { TrustSection } from '@/features/home/components/trust-section';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { getHomepageData, getHomepageSection, toSliderProduct } from '@/features/home/lib/homepage-data';
import { listActiveBanners } from '@/server/services/banner.service';
import { Link } from '@/i18n/routing';

type Locale = 'fa' | 'ps' | 'en';

type ProductSectionProps = {
  section: 'featured' | 'bestSelling' | 'newest' | 'popular';
  locale: Locale;
  title: Record<Locale, string>;
  subtitle?: Record<Locale, string>;
  href: string;
  badge: string;
  accentColor?: string;
};

function SectionSkeleton() {
  return <div className="mx-auto my-6 h-64 max-w-screen-xl animate-pulse rounded-3xl bg-muted/40 sm:my-8" aria-hidden />;
}

async function HomeProductSection({ section, locale, title, subtitle, href, badge, accentColor }: ProductSectionProps) {
  const products = await getHomepageSection(section, 12);
  if (products.length === 0) return null;
  const sliderProducts = products.map((product) => toSliderProduct(product, badge));
  return <ProductSliderSection title={title[locale]} subtitle={subtitle?.[locale]} viewAllHref={href} products={sliderProducts} locale={locale} accentColor={accentColor} />;
}

async function LowerRecommendationSections({ locale }: { locale: Locale }) {
  const data = await getHomepageData();
  const seen = new Set<string>();
  const uniquePool = [...data.featured, ...data.bestSelling, ...data.popular, ...data.newest]
    .filter((product) => !seen.has(product.id) && seen.add(product.id))
    .slice(0, 24)
    .map((product) => toSliderProduct(product));
  if (uniquePool.length === 0) return null;
  return <><PersonalizedProductsSection products={uniquePool} locale={locale} /><RecentlyViewedSection products={uniquePool} locale={locale} /></>;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (['fa', 'ps', 'en'].includes(rawLocale) ? rawLocale : 'fa') as Locale;
  setRequestLocale(locale);

  const heroBanners = await listActiveBanners('HOME_HERO', 6).catch(() => []);
  const quickLinks = locale === 'en'
    ? { categories: 'Browse categories', stores: 'Explore stores', traditional: 'Local & traditional' }
    : locale === 'ps'
      ? { categories: 'کټګورۍ وګورئ', stores: 'پلورنځي وګورئ', traditional: 'کورني او دودیز محصولات' }
      : { categories: 'دسته‌بندی‌ها', stores: 'فروشگاه‌ها', traditional: 'محصولات وطنی و سنتی' };

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="min-h-dvh pb-16 md:pb-0">
        <HomepageHeroCarousel banners={heroBanners} locale={locale} />

        <section aria-label={locale === 'en' ? 'Marketplace shortcuts' : locale === 'ps' ? 'د بازار لنډې لارې' : 'مسیرهای اصلی بازار'} className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-screen-xl grid-cols-3 gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-4">
            <Link href="/categories" className="group flex min-h-16 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-2 py-2.5 text-center text-[11px] font-extrabold text-foreground transition hover:border-primary/30 hover:bg-primary/5 sm:min-h-20 sm:text-xs">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-10 sm:w-10"><LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden /></span>
              <span className="leading-4">{quickLinks.categories}</span>
            </Link>
            <Link href="/stores" className="group flex min-h-16 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-2 py-2.5 text-center text-[11px] font-extrabold text-foreground transition hover:border-primary/30 hover:bg-primary/5 sm:min-h-20 sm:text-xs">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-10 sm:w-10"><Store className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden /></span>
              <span className="leading-4">{quickLinks.stores}</span>
            </Link>
            <Link href="/traditional" className="group flex min-h-16 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-2 py-2.5 text-center text-[11px] font-extrabold text-foreground transition hover:border-primary/30 hover:bg-primary/5 sm:min-h-20 sm:text-xs">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-10 sm:w-10"><Sparkles className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden /></span>
              <span className="leading-4">{quickLinks.traditional}</span>
            </Link>
          </div>
        </section>

        <Suspense fallback={<div className="h-24 animate-pulse bg-muted/40" />}><CategoriesSection /></Suspense>
        <Suspense fallback={<div className="h-56 animate-pulse bg-muted/30" />}><TraditionalProductsBanner locale={locale} /></Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HomeProductSection section="featured" locale={locale} title={{ en: 'Special offers', ps: 'ځانګړي وړاندیزونه', fa: 'پیشنهادهای ویژه' }} subtitle={{ en: 'Limited-time products worth checking today', ps: 'د نن ورځې محدود او ارزښتناک وړاندیزونه', fa: 'محصولات محدود و ارزشمند امروز' }} href="/shop?badge=sale" badge="featured" />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <HomeProductSection section="bestSelling" locale={locale} title={{ en: 'Best sellers', ps: 'تر ټولو ډېر پلورل شوي', fa: 'پرفروش‌ترین‌ها' }} href="/shop?sort=bestSelling" badge="best" accentColor="bg-amber-500" />
        </Suspense>
        <DynamicBannerStrip locale={locale} placement="HOME_PROMO_1" />
        <Suspense fallback={<SectionSkeleton />}>
          <HomeProductSection section="newest" locale={locale} title={{ en: 'New arrivals', ps: 'نوي محصولات', fa: 'جدیدترین‌ها' }} href="/shop?sort=newest" badge="new" accentColor="bg-sky-500" />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <HomeProductSection section="popular" locale={locale} title={{ en: 'Popular products', ps: 'مشهور محصولات', fa: 'محبوب‌ترین محصولات' }} href="/shop?sort=popular" badge="popular" accentColor="bg-fuchsia-500" />
        </Suspense>
        <DynamicBannerStrip locale={locale} placement="HOME_PROMO_2" />
        <Suspense fallback={<SectionSkeleton />}><LowerRecommendationSections locale={locale} /></Suspense>
        <DynamicBannerStrip locale={locale} placement="HOME_MID" />
        <BecomeSellerBanner locale={locale} />
        <Suspense fallback={<div className="h-56 animate-pulse bg-muted/30" />}><TrustSection /></Suspense>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
