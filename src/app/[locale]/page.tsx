import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { HomepageHeroCarousel } from '@/features/home/components/homepage-hero-carousel';
import { HomeDiscoveryStrip } from '@/features/home/components/home-discovery-strip';
import { TrustedStoreLogos } from '@/features/home/components/trusted-store-logos';
import { BrandsSection } from '@/features/home/components/brands-section';
import { DynamicBannerStrip } from '@/features/home/components/dynamic-banner-strip';
import { TraditionalProductsBanner } from '@/features/home/components/traditional-products-banner';
import { CategoriesSection } from '@/features/home/components/categories-section';
import { ProductSliderSection } from '@/features/home/components/product-slider-section';
import { PersonalizedProductsSection, RecentlyViewedSection } from '@/features/home/components/personalized-products-section';
import { HomeCatalogGrid } from '@/features/home/components/home-catalog-grid';
import { TrustSection } from '@/features/home/components/trust-section';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { getHomepageData, getHomepageSection, toSliderProduct } from '@/features/home/lib/homepage-data';
import { listActiveBanners } from '@/server/services/banner.service';
import { getCurrentUser } from '@/lib/auth/current-user';

type Locale = 'fa' | 'ps' | 'en';
type ProductSectionProps = { section: 'featured' | 'bestSelling' | 'newest'; locale: Locale; title: Record<Locale, string>; subtitle?: Record<Locale, string>; href: string; badge: string; accentColor?: string; catalog: Awaited<ReturnType<typeof getHomepageData>> };

function SectionSkeleton() { return <div className="mx-auto my-5 h-56 max-w-screen-xl animate-pulse rounded-3xl bg-muted/40 sm:my-7" aria-hidden />; }
function HeroSkeleton() { return <section className="mx-auto max-w-screen-xl px-3 pt-3 sm:px-6 sm:pt-5" aria-hidden><div className="relative h-[250px] overflow-hidden rounded-[24px] border border-border bg-muted/40 sm:h-[330px] lg:h-[350px]"><div className="absolute inset-x-5 bottom-5 max-w-xl space-y-3 sm:inset-x-8 sm:bottom-8"><div className="h-7 w-24 animate-pulse rounded-full bg-background/60" /><div className="h-10 w-4/5 animate-pulse rounded-xl bg-background/50" /><div className="h-10 w-48 animate-pulse rounded-xl bg-background/50" /></div></div></section>; }

async function HomeHeroSection({ locale }: { locale: Locale }) { const banners = await listActiveBanners('HOME_HERO', 6).catch(() => []); return <HomepageHeroCarousel banners={banners} locale={locale} />; }

function HomeProductSection({ section, locale, title, subtitle, href, badge, accentColor, catalog }: ProductSectionProps) {
  const products = catalog[section];
  if (!products.length) return null;
  return <ProductSliderSection title={title[locale]} subtitle={subtitle?.[locale]} viewAllHref={href} products={products.map((product) => toSliderProduct(product, badge))} locale={locale} accentColor={accentColor} />;
}

async function LowerRecommendationSections({ locale, userId, catalog }: { locale: Locale; userId?: string | null; catalog: Awaited<ReturnType<typeof getHomepageData>> }) {
  const personalizedPopular = userId ? await getHomepageSection('popular', 24, userId) : [];
  const seen = new Set<string>();
  const uniquePool = [...personalizedPopular, ...catalog.featured, ...catalog.bestSelling, ...catalog.popular, ...catalog.newest]
    .filter((product) => !seen.has(product.id) && seen.add(product.id))
    .slice(0, 24);
  if (!uniquePool.length) return null;
  return <><PersonalizedProductsSection products={uniquePool.map((product) => toSliderProduct(product))} locale={locale} /><RecentlyViewedSection products={uniquePool.map((product) => toSliderProduct(product))} locale={locale} /><HomeCatalogGrid products={uniquePool} locale={locale} /></>;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (['fa', 'ps', 'en'].includes(rawLocale) ? rawLocale : 'fa') as Locale;
  setRequestLocale(locale);
  const [user, catalog] = await Promise.all([getCurrentUser(), getHomepageData()]);

  return <div className="min-h-dvh bg-background"><SiteHeader /><main id="main" className="min-h-dvh pb-16 md:pb-0">
    <HomeDiscoveryStrip locale={locale} />
    <Suspense fallback={<HeroSkeleton />}><HomeHeroSection locale={locale} /></Suspense>
    <Suspense fallback={<div className="h-56 animate-pulse bg-muted/30" />}><CategoriesSection /></Suspense>
    <Suspense fallback={<div className="h-28 animate-pulse bg-muted/20" />}><TrustedStoreLogos locale={locale} /></Suspense>
    <Suspense fallback={<div className="h-44 animate-pulse bg-muted/20" />}><BrandsSection locale={locale} /></Suspense>
    <Suspense fallback={<SectionSkeleton />}><TraditionalProductsBanner locale={locale} /></Suspense>
    <Suspense fallback={<SectionSkeleton />}><HomeProductSection section="featured" locale={locale} catalog={catalog} title={{ en: 'Today’s picks', ps: 'د نن غوره انتخابونه', fa: 'انتخاب‌های امروز' }} subtitle={{ en: 'A focused set of products worth your attention', ps: 'د پام وړ او غوره محصولات', fa: 'مجموعه‌ای متمرکز از محصولات ارزشمند' }} href="/shop?sort=popular" badge="featured" accentColor="bg-rose-500" /></Suspense>
    <Suspense fallback={<SectionSkeleton />}><HomeProductSection section="bestSelling" locale={locale} catalog={catalog} title={{ en: 'Best sellers', ps: 'تر ټولو ډېر پلورل شوي', fa: 'پرفروش‌ترین‌ها' }} subtitle={{ en: 'Products customers keep choosing', ps: 'هغه محصولات چې پیرودونکي یې بیا غوره می‌کنند', fa: 'محصولاتی که مشتریان بیشتر انتخاب می‌کنند' }} href="/shop?sort=bestSelling" badge="best" accentColor="bg-amber-500" /></Suspense>
    <DynamicBannerStrip locale={locale} placement="HOME_PROMO_1" />
    <Suspense fallback={<SectionSkeleton />}><HomeProductSection section="newest" locale={locale} catalog={catalog} title={{ en: 'Fresh arrivals', ps: 'تازه راغلي محصولات', fa: 'تازه‌واردها' }} subtitle={{ en: 'New products to discover before everyone else', ps: 'نوي محصولات چې لومړی یې تاسو ومومئ', fa: 'محصولات تازه برای کشف زودتر از دیگران' }} href="/shop?sort=newest" badge="new" accentColor="bg-sky-500" /></Suspense>
    <Suspense fallback={<SectionSkeleton />}><LowerRecommendationSections locale={locale} userId={user?.id} catalog={catalog} /></Suspense>
    <DynamicBannerStrip locale={locale} placement="HOME_MID" />
    <Suspense fallback={<div className="h-56 animate-pulse bg-muted/30" />}><TrustSection /></Suspense>
  </main><SiteFooter /><BottomNavigation /></div>;
}
