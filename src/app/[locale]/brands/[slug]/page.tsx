import Image from 'next/image';
import { ArrowLeft, BadgeCheck, MapPin, Package, Store, UserRound } from 'lucide-react';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { Link } from '@/i18n/routing';
import { Container } from '@/components/layout/container';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { MarketplaceProductCard } from '@/components/marketplace-product-card';
import { getProductLocalizedTexts } from '@/server/localization/product-localization';
import { getProductService } from '@/server/infrastructure/registry';
import { decodeRouteParam } from '@/lib/url-params';

type Locale = 'fa' | 'ps' | 'en';
type BrandRecord = { id: string; slug: string; name: string; description: string | null; logoUrl: string | null; bannerUrl: string | null; country: string | null; sellerId: string; sellerName: string; shopName: string | null; city: string | null; productCount: number };

const copy = (locale: Locale) => locale === 'en'
  ? { brand: 'Brand', store: 'Store', seller: 'Seller', products: 'Products', viewStore: 'Open store', empty: 'No products are available in this brand yet.', unavailable: 'Brands are temporarily unavailable.', country: 'Country' }
  : locale === 'ps'
    ? { brand: 'برانډ', store: 'پلورنځی', seller: 'پلورونکی', products: 'محصولات', viewStore: 'پلورنځی پرانیزئ', empty: 'په دې برانډ کې تر اوسه کوم محصول نشته.', unavailable: 'برانډونه اوس مهال د لاسرسي وړ نه دي.', country: 'هېواد' }
    : { brand: 'برند', store: 'فروشگاه', seller: 'فروشنده', products: 'محصولات', viewStore: 'ورود به فروشگاه', empty: 'هنوز محصولی در این برند ثبت نشده است.', unavailable: 'برندها موقتاً در دسترس نیستند.', country: 'کشور' };

async function loadBrand(slug: string) {
  if (!isDatabaseConfigured()) return { status: 'unavailable' as const };
  try {
    const rows = await prisma.$queryRaw<BrandRecord[]>(Prisma.sql`
      SELECT b."id", b."slug", b."name", b."description", b."logoUrl", b."bannerUrl", b."country",
             b."sellerId", u."fullName" AS "sellerName", u."sellerShopName" AS "shopName", u."sellerCity" AS "city",
             (SELECT COUNT(*)::int FROM "Product" p WHERE p."brandId" = b."id" AND p."isActive" = true) AS "productCount"
      FROM "SellerBrand" b
      JOIN "User" u ON u."id" = b."sellerId"
      WHERE b."slug" = ${slug} AND b."isActive" = true AND u."role" = 'seller' AND u."sellerStatus" = 'approved' AND u."isActive" = true
      LIMIT 1
    `);
    const brand = rows[0];
    if (!brand) return { status: 'not_found' as const };

    // ProductService already supplies the full ProductSummary shape (ratings, images, brand metadata, etc.).
    // Request a bounded seller slice, then keep only products explicitly assigned to this brand.
    const result = await getProductService().listProducts({ sellerId: brand.sellerId, isActive: true, page: 1, pageSize: 100, sort: 'bestSelling' });
    const products = result.products.filter((product) => product.brandId === brand.id).slice(0, 24);
    return { status: 'ok' as const, brand, products };
  } catch (error) {
    console.error('[brands/[slug]] DB error:', error);
    return { status: 'unavailable' as const };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = decodeRouteParam(rawSlug);
  const result = await loadBrand(slug);
  if (result.status !== 'ok') return { title: 'Brand | Eshop' };
  return { title: `${result.brand.name} | Eshop`, description: result.brand.description ?? `برند ${result.brand.name} در ایشاپ` };
}

export default async function BrandPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug: rawSlug } = await params;
  const locale = (['fa', 'ps', 'en'].includes(rawLocale) ? rawLocale : 'fa') as Locale;
  const slug = decodeRouteParam(rawSlug);
  setRequestLocale(locale);
  const t = copy(locale);
  const result = await loadBrand(slug);
  if (result.status === 'not_found') notFound();
  if (result.status === 'unavailable') return <div className="min-h-dvh bg-background"><SiteHeader /><main className="pb-20 md:pb-0"><Container size="xl" className="py-16"><div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-12 text-center text-sm font-semibold text-amber-800 dark:text-amber-200">{t.unavailable}</div></Container></main><SiteFooter /><BottomNavigation /></div>;

  const localized = await getProductLocalizedTexts(result.products.map((product) => product.id), locale);
  const products = result.products.map((product) => {
    const text = localized.get(product.id);
    return text ? { ...product, name: text.name, shortDescription: text.shortDescription } : product;
  });

  return <div className="min-h-dvh bg-background"><SiteHeader /><main className="pb-20 md:pb-0"><section className="relative overflow-hidden border-b border-border bg-card"><div className="relative h-44 sm:h-56">{result.brand.bannerUrl ? <Image src={result.brand.bannerUrl} alt="" fill priority sizes="100vw" className="object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-primary/15 via-background to-primary/5" />}<div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" /></div><Container size="xl" className="relative -mt-16 pb-6 sm:-mt-20 sm:pb-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-end gap-4"><div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-background bg-card shadow-xl sm:h-28 sm:w-28">{result.brand.logoUrl ? <Image src={result.brand.logoUrl} alt={result.brand.name} fill sizes="112px" className="object-cover" /> : <span className="text-3xl font-black text-primary">{result.brand.name.charAt(0)}</span>}</div><div className="pb-1"><div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-extrabold text-emerald-600"><BadgeCheck className="h-3.5 w-3.5" />{t.brand}</div><h1 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">{result.brand.name}</h1>{result.brand.description ? <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{result.brand.description}</p> : null}</div></div><Link href={`/store/${result.brand.sellerId}` as never} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 text-sm font-extrabold text-primary hover:bg-primary/10"><Store className="h-4 w-4" />{t.viewStore}<ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link></div></Container></section><Container size="xl" className="py-6 sm:py-9"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="h-4 w-4" />{t.seller}</div><p className="mt-2 text-sm font-black">{result.brand.sellerName}</p></div><div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Store className="h-4 w-4" />{t.store}</div><p className="mt-2 text-sm font-black">{result.brand.shopName ?? result.brand.name}</p>{result.brand.city ? <p className="mt-1 text-[10px] text-muted-foreground">{result.brand.city}</p> : null}</div><div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Package className="h-4 w-4" />{t.products}</div><p className="mt-2 text-sm font-black">{result.brand.productCount.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR')}</p>{result.brand.country ? <p className="mt-1 text-[10px] text-muted-foreground">{t.country}: {result.brand.country}</p> : null}</div></div><section className="mt-8" aria-labelledby="brand-products-title"><div className="mb-4 flex items-end justify-between gap-3"><div><h2 id="brand-products-title" className="text-xl font-black tracking-tight sm:text-2xl">{t.products}</h2></div><Link href={`/shop?sellerId=${result.brand.sellerId}` as never} className="text-xs font-bold text-primary">{t.viewStore}</Link></div>{products.length ? <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">{products.map((product) => <MarketplaceProductCard key={product.id} product={product} locale={locale} currency="AFN" view="grid" />)}</div> : <div className="rounded-3xl border border-dashed border-border p-14 text-center text-sm font-semibold text-muted-foreground">{t.empty}</div>}</section></Container></main><SiteFooter /><BottomNavigation /></div>;
}
