import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { ShopPageClient } from '@/features/shop';
import { ShopHotProducts } from '@/features/shop/components/shop-hot-products';
import { getProductService } from '@/server/infrastructure/registry';
import { getProductLocalizedTexts, normalizeCatalogLocale } from '@/server/localization/product-localization';
import { productListQuerySchema } from '@/lib/validation/product';
import { prisma } from '@/lib/db';
import { releaseExpiredStockReservations } from '@/lib/orders/order-engine';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

function toQueryObject(input: Record<string, string | string[] | undefined>): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && value.length > 0) output[key] = value;
    else if (Array.isArray(value) && value.length > 0) output[key] = value[0] ?? '';
  }
  return output;
}

async function getInitialCatalog(rawLocale: string, rawSearchParams: Record<string, string | string[] | undefined>) {
  try {
    await releaseExpiredStockReservations(prisma);
    const parsed = productListQuerySchema.safeParse(toQueryObject(rawSearchParams));
    const query = parsed.success ? parsed.data : {};
    const locale = normalizeCatalogLocale(rawLocale);
    const pageSize = query.limit ?? query.pageSize ?? 40;
    const result = await getProductService().listProducts({
      q: query.q,
      categoryKey: query.categoryKey,
      subcategoryKey: query.subcategoryKey,
      sellerId: query.sellerId,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      inStock: query.inStock,
      featured: query.featured,
      hasDiscount: query.hasDiscount,
      minRating: query.minRating,
      badge: query.badge,
      sort: query.sort,
      page: 1,
      pageSize,
      rerank: Boolean(query.q),
      isTraditional: query.isTraditional ?? false,
    });
    const localized = await getProductLocalizedTexts(result.products.map((product) => product.id), locale);
    const products = result.products.map((product) => {
      const text = localized.get(product.id);
      return text ? { ...product, name: text.name, shortDescription: text.shortDescription } : product;
    });
    return { products, meta: { total: result.total, page: result.page, pageSize: result.pageSize, hasMore: result.hasMore } };
  } catch {
    return { products: [], meta: null };
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
  const safeLocale = (['fa', 'ps', 'en'].includes(locale) ? locale : 'fa') as 'fa' | 'ps' | 'en';
  const initialCatalog = await getInitialCatalog(locale, resolvedSearchParams);
  return <><SiteHeader /><main id="main" className="min-h-dvh bg-background pb-16 md:pb-0"><div className="mx-auto max-w-screen-xl px-2 py-5 sm:px-6"><nav aria-label={t('breadcrumb.label')} className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground"><a href={`/${locale}`} className="transition-colors hover:text-primary">{tNav('home')}</a><span className="text-border" aria-hidden="true">/</span><span className="font-semibold text-foreground" aria-current="page">{tNav('shop')}</span></nav><ShopPageClient locale={locale} currency="AFN" initialProducts={initialCatalog.products} initialMeta={initialCatalog.meta} /></div><ShopHotProducts locale={safeLocale} /></main><SiteFooter /><BottomNavigation /></>;
}
