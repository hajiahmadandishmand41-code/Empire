import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { HomepageHeroCarousel } from '@/features/home/components/homepage-hero-carousel';
import { HomeDiscoveryStrip } from '@/features/home/components/home-discovery-strip';
import { DynamicBannerStrip } from '@/features/home/components/dynamic-banner-strip';
import { TraditionalProductsBanner } from '@/features/home/components/traditional-products-banner';
import { CategoryShowcase, type CategoryTile } from '@/features/home/components/category-showcase';
import { ProductShowcaseSection } from '@/features/home/components/product-showcase-section';
import { StoresBrandsSection, type BrandTile, type StoreTile } from '@/features/home/components/stores-brands-section';
import { TrustSection } from '@/features/home/components/trust-section';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { getCategoryRepository, getSellerRepository } from '@/server/infrastructure/registry';
import { getHomepageData } from '@/features/home/lib/homepage-data';
import { listActiveBanners } from '@/server/services/banner.service';
import { isDatabaseConfigured } from '@/lib/db';
import {
  isShowcaseMode,
  showcaseBrands,
  showcaseCategories,
  showcaseProducts,
  showcaseStores,
} from '@/features/home/lib/showcase-data';
import type { ProductSummary } from '@/types';

type Locale = 'fa' | 'ps' | 'en';

/**
 * Homepage composition.
 *
 * The previous version stacked six near-identical product rails plus a
 * 15-item catalogue grid, two separate store/brand bands and a category
 * ranking — well over a hundred products before the footer. It read as one
 * long, undifferentiated scroll.
 *
 * This version keeps three focused product bands and deliberately varies
 * their layout (rail → switchable grid/list → rail), the way established
 * marketplaces do, and merges stores + brands into a single two-column band.
 */

const SECTION_SIZE = 8;

function SectionSkeleton() {
  return <div className="section-shell my-5"><div className="h-56 animate-pulse rounded-2xl bg-muted/40" /></div>;
}

function HeroSkeleton() {
  return (
    <section className="section-shell pt-3 sm:pt-5" aria-hidden>
      <div className="h-[260px] animate-pulse rounded-[24px] border border-border bg-muted/40 sm:h-[360px] lg:h-[420px]" />
    </section>
  );
}

function DataUnavailable({ title }: { title: string }) {
  return (
    <section role="status" className="section-shell py-2">
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-200">
        <span aria-hidden="true" className="inline-block h-2 w-2 shrink-0 rounded-full bg-amber-500" />
        {title}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ hero */

async function loadHomeHero() {
  try {
    return await listActiveBanners('HOME_HERO', 6);
  } catch (err) {
    console.error('[home/hero] DB error:', err);
    return null;
  }
}

async function HomeHeroSection({ locale }: { locale: Locale }) {
  // Without a database the carousel still has its built-in editorial slides,
  // so the hero is never an empty rectangle.
  if (isShowcaseMode()) return <HomepageHeroCarousel banners={[]} locale={locale} />;

  const banners = await loadHomeHero();
  if (!banners) {
    const title = locale === 'en'
      ? 'Hero content is temporarily unavailable.'
      : locale === 'ps'
        ? 'د مخ اتلانیزه منځپانګه اوس مهال د لاسرسي وړ نه ده.'
        : 'محتوای بنر اصلی موقتاً در دسترس نیست.';
    return <DataUnavailable title={title} />;
  }
  return <HomepageHeroCarousel banners={banners} locale={locale} />;
}

/* ------------------------------------------------------------ categories */

async function loadCategories(locale: Locale): Promise<CategoryTile[] | null> {
  if (isShowcaseMode()) return showcaseCategories(locale);
  try {
    const rows = await getCategoryRepository().findAll(true, true);
    return rows
      .filter((category) => !category.parentId)
      .slice(0, 10)
      .map((category) => ({
        id: category.id,
        key: category.key,
        slug: category.slug,
        name: category.name?.trim() || category.key,
        productCount: Number(category.productCount ?? 0),
        imageUrl: category.imageUrl,
      }));
  } catch (err) {
    console.error('[home/categories] DB error:', err);
    return null;
  }
}

async function HomeCategories({ locale }: { locale: Locale }) {
  const categories = await loadCategories(locale);
  if (!categories) {
    const title = locale === 'en'
      ? 'Categories are temporarily unavailable.'
      : locale === 'ps'
        ? 'کټګورۍ اوس مهال د لاسرسي وړ نه دي.'
        : 'دسته‌بندی‌ها موقتاً در دسترس نیستند.';
    return <DataUnavailable title={title} />;
  }
  return <CategoryShowcase categories={categories} locale={locale} />;
}

/* ------------------------------------------------------- stores + brands */

async function loadStoresAndBrands(locale: Locale): Promise<{ stores: StoreTile[]; brands: BrandTile[] } | null> {
  if (isShowcaseMode()) {
    return { stores: showcaseStores(locale), brands: showcaseBrands(locale) };
  }
  try {
    const result = await getSellerRepository().findPublicMany({ q: '', page: 1, pageSize: 10, sort: 'popular' });
    const stores: StoreTile[] = result.items.slice(0, 6).map((store) => ({
      id: store.id,
      shopName: store.shopName,
      productCount: Number(store.productCount ?? 0),
      logoUrl: store.logoUrl,
    }));
    // Brands are derived from the same verified-seller set until a dedicated
    // brand repository is wired up; the tile contract is already brand-shaped.
    const brands: BrandTile[] = result.items.slice(0, 8).map((store) => ({
      id: store.id,
      slug: store.id,
      name: store.shopName,
      productCount: Number(store.productCount ?? 0),
      logoUrl: store.logoUrl,
    }));
    return { stores, brands };
  } catch (err) {
    console.error('[home/stores-brands] DB error:', err);
    return null;
  }
}

async function HomeStoresBrands({ locale }: { locale: Locale }) {
  const data = await loadStoresAndBrands(locale);
  if (!data) {
    const title = locale === 'en'
      ? 'Stores and brands are temporarily unavailable.'
      : locale === 'ps'
        ? 'پلورنځي او برانډونه اوس مهال د لاسرسي وړ نه دي.'
        : 'فروشگاه‌ها و برندها موقتاً در دسترس نیستند.';
    return <DataUnavailable title={title} />;
  }
  return <StoresBrandsSection stores={data.stores} brands={data.brands} locale={locale} />;
}

/* ----------------------------------------------------------------- page */

type HomeCatalog = Awaited<ReturnType<typeof getHomepageData>>;
const EMPTY_CATALOG: HomeCatalog = { newest: [], bestSelling: [], mostViewed: [], popular: [], featured: [] };

const SECTION_COPY: Record<Locale, {
  featured: { title: string; subtitle: string };
  best: { title: string; subtitle: string };
  newest: { title: string; subtitle: string };
}> = {
  fa: {
    featured: { title: 'پیشنهاد ویژه امروز', subtitle: 'منتخبی از بهترین قیمت‌های امروز بازار' },
    best: { title: 'پرفروش‌ترین‌ها', subtitle: 'محصولاتی که مشتریان بیشتر انتخاب می‌کنند' },
    newest: { title: 'تازه‌واردها', subtitle: 'جدیدترین محصولات را زودتر از دیگران ببینید' },
  },
  ps: {
    featured: { title: 'د نن ځانګړی وړاندیز', subtitle: 'د نن ورځې تر ټولو غوره بیې' },
    best: { title: 'تر ټولو ډېر پلورل شوي', subtitle: 'هغه محصولات چې پیرودونکي یې ډېر غوره کوي' },
    newest: { title: 'تازه راغلي', subtitle: 'نوي محصولات له نورو مخکې وګورئ' },
  },
  en: {
    featured: { title: "Today's special offers", subtitle: "A curated set of today's best prices" },
    best: { title: 'Best sellers', subtitle: 'The products customers keep choosing' },
    newest: { title: 'New arrivals', subtitle: 'See the newest products before everyone else' },
  },
};

function pick(catalog: HomeCatalog, key: 'featured' | 'bestSelling' | 'newest', locale: Locale): ProductSummary[] {
  const live = catalog[key];
  if (live.length) return live.slice(0, SECTION_SIZE);
  return showcaseProducts(locale, key === 'bestSelling' ? 'bestSelling' : key, SECTION_SIZE);
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (['fa', 'ps', 'en'].includes(rawLocale) ? rawLocale : 'fa') as Locale;
  setRequestLocale(locale);

  let catalog: HomeCatalog = EMPTY_CATALOG;
  if (isDatabaseConfigured()) {
    try {
      catalog = await getHomepageData();
    } catch (err) {
      console.error('[home] failed to load homepage data:', err);
    }
  }

  const copy = SECTION_COPY[locale];
  const featured = pick(catalog, 'featured', locale);
  const bestSelling = pick(catalog, 'bestSelling', locale);
  const newest = pick(catalog, 'newest', locale);

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="min-h-dvh pb-16 md:pb-0">
        <HomeDiscoveryStrip locale={locale} />

        <Suspense fallback={<HeroSkeleton />}>
          <HomeHeroSection locale={locale} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HomeCategories locale={locale} />
        </Suspense>

        {/* 1 — rail: fast, browsable, sets the "there is more" affordance. */}
        <ProductShowcaseSection
          title={copy.featured.title}
          subtitle={copy.featured.subtitle}
          products={featured}
          viewAllHref="/shop?sort=popular"
          locale={locale}
          layout="rail"
          icon="flame"
        />

        <DynamicBannerStrip locale={locale} placement="HOME_PROMO_1" />

        <Suspense fallback={<SectionSkeleton />}>
          <HomeStoresBrands locale={locale} />
        </Suspense>

        {/* 2 — switchable: the shopper picks grid or horizontal list. */}
        <ProductShowcaseSection
          title={copy.best.title}
          subtitle={copy.best.subtitle}
          products={bestSelling}
          viewAllHref="/shop?sort=bestSelling"
          locale={locale}
          layout="switchable"
          icon="trending"
          accent="var(--gradient-deal)"
        />

        <Suspense fallback={<SectionSkeleton />}>
          <TraditionalProductsBanner locale={locale} />
        </Suspense>

        {/* 3 — rail again, but visually separated by the alt band. */}
        <ProductShowcaseSection
          title={copy.newest.title}
          subtitle={copy.newest.subtitle}
          products={newest}
          viewAllHref="/shop?sort=newest"
          locale={locale}
          layout="rail"
          icon="sparkles"
          alt
        />

        <DynamicBannerStrip locale={locale} placement="HOME_MID" />

        <Suspense fallback={<SectionSkeleton />}>
          <TrustSection />
        </Suspense>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
