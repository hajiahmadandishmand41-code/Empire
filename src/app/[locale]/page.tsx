import { Suspense } from 'react';
import Image from 'next/image';
import { Heart, ShieldCheck, Star, Store } from 'lucide-react';
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
import { getCategoryRepository, getSellerRepository } from '@/server/infrastructure/registry';
import { getHomepageData, getHomepageSection, toSliderProduct } from '@/features/home/lib/homepage-data';
import { listActiveBanners } from '@/server/services/banner.service';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isDatabaseConfigured } from '@/lib/db';

type Locale = 'fa' | 'ps' | 'en';
type ProductSectionProps = { section: 'featured' | 'bestSelling' | 'newest'; locale: Locale; title: Record<Locale, string>; subtitle?: Record<Locale, string>; href: string; badge: string; accentColor?: string; catalog: Awaited<ReturnType<typeof getHomepageData>> };

function SectionSkeleton() { return <div className="mx-auto my-4 h-44 max-w-screen-xl animate-pulse rounded-2xl bg-muted/40 sm:my-6" aria-hidden />; }
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

async function HomePopularStores({ locale }: { locale: Locale }) {
  if (!isDatabaseConfigured()) return null;
  const result = await getSellerRepository().findPublicMany({ q: '', page: 1, pageSize: 10, sort: 'popular' }).catch(() => ({ items: [] }));
  if (!result.items.length) return null;
  const copy = locale === 'en'
    ? { title: 'Popular e-shops', subtitle: 'Discover stores customers choose most', all: 'View all stores' }
    : locale === 'ps'
      ? { title: 'مشهور ای‌شاپونه', subtitle: 'هغه پلورنځي ومومئ چې پیرودونکي یې ډېر غوره کوي', all: 'ټول پلورنځي' }
      : { title: 'ای‌شاپ‌های محبوب', subtitle: 'فروشگاه‌هایی که مشتریان بیشتر انتخاب می‌کنند', all: 'مشاهده همه فروشگاه‌ها' };
  return <section className="border-y border-border bg-card py-4 sm:py-6" aria-label={copy.title}>
    <div className="mx-auto max-w-screen-xl px-2.5 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400"><Store className="h-4 w-4" aria-hidden="true" /></span>
          <div className="min-w-0"><h2 className="truncate text-sm font-black sm:text-lg">{copy.title}</h2><p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">{copy.subtitle}</p></div>
        </div>
        <a href={locale === 'en' ? '/en/stores' : locale === 'ps' ? '/ps/stores' : '/fa/stores'} className="min-h-8 shrink-0 rounded-full border border-border bg-background px-2.5 py-1.5 text-[10px] font-bold sm:px-3 sm:text-xs">{copy.all}</a>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {result.items.slice(0, 10).map((store) => <a key={store.id} href={locale === 'en' ? `/en/store/${store.id}` : locale === 'ps' ? `/ps/store/${store.id}` : `/fa/store/${store.id}`} aria-label={store.shopName} className="group relative flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-background p-2.5 transition hover:border-primary/30 hover:shadow-sm sm:p-3">
          <span className="pointer-events-none absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-rose-500 shadow-sm ring-1 ring-border/70" aria-hidden="true"><Heart className="h-3.5 w-3.5 fill-current" /></span>
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted sm:h-14 sm:w-14">
            {store.logoUrl ? <Image src={store.logoUrl} alt="" fill sizes="56px" className="object-cover" /> : <span className="text-sm font-black text-primary">{store.shopName.charAt(0)}</span>}
            <span className="absolute -end-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-background bg-emerald-500 text-white"><ShieldCheck className="h-2 w-2" aria-hidden="true" /></span>
          </span>
          <span className="min-w-0 pe-7"><strong className="block truncate text-[11px] font-black sm:text-xs">{store.shopName}</strong><span className="mt-0.5 block truncate text-[9px] text-muted-foreground sm:text-[10px]">{store.productCount} {locale === 'en' ? 'products' : locale === 'ps' ? 'محصولات' : 'محصول'}</span></span>
        </a>)}
      </div>
    </div>
  </section>;
}

async function PopularCategoryRanking({ locale }: { locale: Locale }) {
  if (!isDatabaseConfigured()) return null;
  const categories = await getCategoryRepository().findAll(true, true).catch(() => []);
  const top = categories.filter((category) => !category.parentId).sort((a, b) => Number(b.productCount ?? 0) - Number(a.productCount ?? 0)).slice(0, 2);
  if (!top.length) return null;
  const title = locale === 'en' ? 'Popular categories' : locale === 'ps' ? 'مشهورې کټګورۍ' : 'دسته‌های محبوب';
  const productLabel = locale === 'en' ? 'products' : locale === 'ps' ? 'محصولات' : 'محصول';
  const numberLocale = locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR';
  return <section className="border-b border-border bg-card py-4 sm:py-6" aria-label={title}><div className="mx-auto max-w-screen-xl px-2.5 sm:px-6"><div className="mb-3 flex items-center gap-2 sm:mb-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary"><Star className="h-4 w-4" aria-hidden="true" /></span><h2 className="text-sm font-black sm:text-lg">{title}</h2></div><div className="grid grid-cols-2 gap-2 sm:gap-3">{top.map((category, index) => <a key={category.id} href={locale === 'en' ? `/en/category/${category.slug}` : locale === 'ps' ? `/ps/category/${category.slug}` : `/fa/category/${category.slug}`} className="relative flex min-h-20 items-center gap-2 overflow-hidden rounded-2xl border border-border bg-background p-2.5 transition hover:border-primary/30 hover:shadow-sm sm:min-h-24 sm:p-3"><span className="absolute start-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-black text-primary-foreground">{index + 1}</span><span className="relative ms-8 h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-16 sm:w-16">{category.imageUrl ? <Image src={category.imageUrl} alt={category.name} fill sizes="64px" loading="lazy" className="object-cover" /> : <span className="flex h-full w-full items-center justify-center text-sm font-black text-muted-foreground">{index + 1}</span>}</span><span className="min-w-0"><strong className="block truncate text-xs font-black sm:text-sm">{category.name}</strong><span className="mt-1 block text-[10px] text-muted-foreground sm:text-[10px]">{Number(category.productCount ?? 0).toLocaleString(numberLocale)} {productLabel}</span></span></a>)}</div></div></section>;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (['fa', 'ps', 'en'].includes(rawLocale) ? rawLocale : 'fa') as Locale;
  setRequestLocale(locale);
  const [user, catalog] = await Promise.all([getCurrentUser(), getHomepageData()]);

  return <div className="min-h-dvh bg-background"><SiteHeader /><main id="main" className="min-h-dvh pb-16 md:pb-0">
    <HomeDiscoveryStrip locale={locale} />
    <Suspense fallback={<HeroSkeleton />}><HomeHeroSection locale={locale} /></Suspense>
    <Suspense fallback={<div className="h-48 animate-pulse bg-muted/30" />}><CategoriesSection /></Suspense>
    <Suspense fallback={<div className="h-32 animate-pulse bg-muted/20" />}><TrustedStoreLogos locale={locale} /></Suspense>
    <Suspense fallback={<div className="h-40 animate-pulse bg-muted/20" />}><BrandsSection locale={locale} /></Suspense>
    <DynamicBannerStrip locale={locale} placement="HOME_PROMO_1" />
    <Suspense fallback={<SectionSkeleton />}><TraditionalProductsBanner locale={locale} /></Suspense>
    <Suspense fallback={<SectionSkeleton />}><HomeProductSection section="featured" locale={locale} catalog={catalog} title={{ en: 'Today’s picks', ps: 'د نن غوره انتخابونه', fa: 'انتخاب‌های امروز' }} subtitle={{ en: 'A focused set of products worth your attention', ps: 'د پام وړ او غوره محصولات', fa: 'انتخابی از محصولات ارزشمند' }} href="/shop?sort=popular" badge="featured" accentColor="bg-rose-500" /></Suspense>
    <Suspense fallback={<SectionSkeleton />}><HomeProductSection section="bestSelling" locale={locale} catalog={catalog} title={{ en: 'Best sellers', ps: 'تر ټولو ډېر پلورل شوي', fa: 'پرفروش‌ترین‌ها' }} subtitle={{ en: 'Products customers keep choosing', ps: 'هغه محصولات چې پیرودونکي یې بیا غوره کوي', fa: 'محصولاتی که مشتریان بیشتر انتخاب می‌کنند' }} href="/shop?sort=bestSelling" badge="best" accentColor="bg-amber-500" /></Suspense>
    <Suspense fallback={<SectionSkeleton />}><HomeProductSection section="newest" locale={locale} catalog={catalog} title={{ en: 'Fresh arrivals', ps: 'تازه راغلي محصولات', fa: 'تازه‌واردها' }} subtitle={{ en: 'New products to discover before everyone else', ps: 'نوي محصولات چې لومړی یې تاسو ومومئ', fa: 'محصولات تازه برای کشف زودتر از دیگران' }} href="/shop?sort=newest" badge="new" accentColor="bg-sky-500" /></Suspense>
    <DynamicBannerStrip locale={locale} placement="HOME_MID" />
    <Suspense fallback={<SectionSkeleton />}><LowerRecommendationSections locale={locale} userId={user?.id} catalog={catalog} /></Suspense>
    <Suspense fallback={<SectionSkeleton />}><PopularCategoryRanking locale={locale} /></Suspense>
    <Suspense fallback={<div className="h-44 animate-pulse bg-muted/30" />}><TrustSection /></Suspense>
    <Suspense fallback={<div className="h-56 animate-pulse bg-muted/20" />}><HomePopularStores locale={locale} /></Suspense>
  </main><SiteFooter /><BottomNavigation /></div>;
}
