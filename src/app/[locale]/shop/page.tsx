import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { ShopPageClient } from '@/features/shop';
import { getCategoryRepository, getProductService } from '@/server/infrastructure/registry';
import { getProductLocalizedTexts, normalizeCatalogLocale } from '@/server/localization/product-localization';
import { productListQuerySchema } from '@/lib/validation/product';
import { isDatabaseConfigured } from '@/lib/db';
import { Link } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
type CatalogState = { status: 'ok'; products: Awaited<ReturnType<ReturnType<typeof getProductService>['listProducts']>>['products']; meta: { total: number; page: number; pageSize: number; hasMore: boolean } } | { status: 'unavailable'; products: []; meta: null };
type CategoryNavState = { status: 'ok'; items: Array<{ id: string; key: string; name: string; slug: string }> } | { status: 'unavailable'; items: [] };

function toQueryObject(input: Record<string, string | string[] | undefined>): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && value.length > 0) output[key] = value;
    else if (Array.isArray(value) && value.length > 0) output[key] = value[0] ?? '';
  }
  return output;
}

async function getInitialCatalog(rawLocale: string, rawSearchParams: Record<string, string | string[] | undefined>): Promise<CatalogState> {
  if (!isDatabaseConfigured()) return { status: 'unavailable', products: [], meta: null };
  try {
    const parsed = productListQuerySchema.safeParse(toQueryObject(rawSearchParams));
    const query = parsed.success ? parsed.data : {};
    const locale = normalizeCatalogLocale(rawLocale);
    const pageSize = Math.min(24, query.limit ?? query.pageSize ?? 24);
    const result = await getProductService().listProducts({
      q: query.q, categoryKey: query.categoryKey, subcategoryKey: query.subcategoryKey, sellerId: query.sellerId,
      priceMin: query.priceMin, priceMax: query.priceMax, inStock: query.inStock, featured: query.featured,
      hasDiscount: query.hasDiscount, minRating: query.minRating, badge: query.badge, sort: query.sort,
      page: 1, pageSize, rerank: Boolean(query.q), isTraditional: query.isTraditional ?? false,
    });
    const localized = await getProductLocalizedTexts(result.products.map((product) => product.id), locale);
    const products = result.products.map((product) => { const text = localized.get(product.id); return text ? { ...product, name: text.name, shortDescription: text.shortDescription } : product; });
    return { status: 'ok', products, meta: { total: result.total, page: result.page, pageSize: result.pageSize, hasMore: result.hasMore } };
  } catch {
    return { status: 'unavailable', products: [], meta: null };
  }
}

async function getCategoryNav(): Promise<CategoryNavState> {
  if (!isDatabaseConfigured()) return { status: 'unavailable', items: [] };
  try {
    const rows = await getCategoryRepository().findAll(false, true);
    return { status: 'ok', items: rows.slice(0, 14).map(({ id, key, name, slug }) => ({ id, key, name, slug })) };
  } catch {
    return { status: 'unavailable', items: [] };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'shop' });
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const title = `${t('metaTitle')} | Eshop`;
  const description = t('metaDescription');
  return { title, description, alternates: { canonical: `${siteUrl}/${locale}/shop`, languages: { fa: `${siteUrl}/fa/shop`, ps: `${siteUrl}/ps/shop`, en: `${siteUrl}/en/shop` } }, openGraph: { title, description, type: 'website', url: `${siteUrl}/${locale}/shop`, siteName: 'Eshop' }, twitter: { card: 'summary_large_image', title, description } };
}

export default async function ShopPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('shop');
  const tNav = await getTranslations('nav');
  const [initialCatalog, categoryNav] = await Promise.all([getInitialCatalog(locale, resolvedSearchParams), getCategoryNav()]);
  const categoryCopy = locale === 'ps' ? 'د محصولاتو کټګورۍ' : locale === 'en' ? 'Product categories' : 'دسته‌بندی محصولات';
  const unavailableCopy = locale === 'ps' ? 'د ډیټابېس پیوستون برابر شوی نه دی.' : locale === 'en' ? 'The database is not configured for this preview yet.' : 'اتصال پایگاه داده برای این پیش‌نمایش هنوز تنظیم نشده است.';
  return <><SiteHeader /><main id="main" className="min-h-dvh bg-background pb-16 md:pb-0"><div className="mx-auto max-w-screen-xl px-2 py-4 sm:px-6"><nav aria-label={t('breadcrumb.label')} className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Link href="/" className="transition-colors hover:text-primary">{tNav('home')}</Link><span className="text-border" aria-hidden="true">/</span><span className="font-semibold text-foreground" aria-current="page">{tNav('shop')}</span></nav><section aria-label={categoryCopy} className="sticky top-0 z-20 -mx-2 mb-4 border-y border-border bg-background/95 px-2 py-1.5 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border"><div className="flex h-11 items-center gap-1.5 overflow-x-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><Link href="/shop" className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-extrabold text-primary-foreground">{locale === 'ps' ? 'ټول' : locale === 'en' ? 'All' : 'همه'}</Link>{categoryNav.status === 'unavailable' ? <span className="shrink-0 rounded-lg border border-amber-300/40 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-200">{unavailableCopy}</span> : categoryNav.items.map((category) => <Link key={category.id} href={`/category/${category.slug}`} className="shrink-0 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition hover:border-primary/30 hover:bg-primary/5">{category.name}</Link>)}</div></section><ShopPageClient locale={locale} currency="AFN" initialProducts={initialCatalog.products} initialMeta={initialCatalog.meta} /></div></main><SiteFooter /><BottomNavigation /></>;
}
