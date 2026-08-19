import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { Container } from '@/components/layout/container';
import { Star, MapPin, Package } from 'lucide-react';
import { StoreProductSearch } from '@/features/store/components/store-product-search';

type Props = { params: Promise<{ locale: string; slug: string }> };

function slugify(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
}

async function getSeller(slug: string) {
  const sellers = await prisma.user.findMany({
    where: { role: 'seller', sellerStatus: 'approved', isActive: true },
    select: { id: true, fullName: true, sellerShopName: true, sellerBio: true, sellerLogoUrl: true, sellerBannerUrl: true, sellerCity: true, sellerCountry: true, _count: { select: { products: true, reviews: true } } },
    take: 500,
  });
  return sellers.find((seller) => seller.id === slug || (seller.sellerShopName ? slugify(seller.sellerShopName) === slug : false)) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seller = await getSeller(slug);
  if (!seller) return { title: 'Eshop Seller' };
  const title = `${seller.sellerShopName ?? seller.fullName} | Eshop`;
  return { title, description: seller.sellerBio ?? title };
}

export default async function SellerStorefront({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const seller = await getSeller(slug);
  if (!seller) notFound();
  const products = await prisma.product.findMany({ where: { sellerId: seller.id, isActive: true }, include: { category: true }, orderBy: [{ salesCount: 'desc' }, { createdAt: 'desc' }], take: 48 });
  const reviewAgg = await prisma.review.aggregate({ where: { product: { sellerId: seller.id }, isApproved: true }, _avg: { rating: true }, _count: { _all: true } });
  const averageRating = reviewAgg._avg.rating ?? 0;
  const categories = Array.from(new Map(products.map((p) => [p.category.id, { id: p.category.id, name: p.category.name, slug: p.category.slug }])).values());
  const location = [seller.sellerCity, seller.sellerCountry].filter(Boolean).join(', ');
  const storeProducts = products.map((product) => {
    const image = Array.isArray(product.imagesJson) ? (product.imagesJson as Array<{ src?: string; url?: string }>)[0] : null;
    return { id: product.id, name: product.name, price: Number(product.price), imageUrl: image?.src ?? image?.url ?? null, categoryName: product.category.name };
  });

  return <div className="min-h-dvh bg-background"><SiteHeader /><main id="main">
    <section className="relative overflow-hidden border-b border-border bg-muted/30"><div className="relative h-48 w-full sm:h-64 lg:h-80">{seller.sellerBannerUrl ? <Image src={seller.sellerBannerUrl} alt={seller.sellerShopName ?? seller.fullName} fill className="object-cover" priority sizes="100vw" /> : <div className="h-full w-full bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900" />}<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" /></div><Container size="xl" className="relative -mt-14 pb-6 sm:-mt-16 sm:pb-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end"><div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-card shadow-xl sm:h-28 sm:w-28">{seller.sellerLogoUrl ? <Image src={seller.sellerLogoUrl} alt={seller.sellerShopName ?? seller.fullName} fill className="object-cover" sizes="112px" /> : <div className="flex h-full w-full items-center justify-center bg-emerald-600 text-3xl font-black text-white">{(seller.sellerShopName ?? seller.fullName).charAt(0)}</div>}</div><div className="min-w-0 flex-1 rounded-2xl bg-background/90 p-4 backdrop-blur"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{seller.sellerShopName ?? seller.fullName}</h1><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">فروشگاه تأییدشده</span></div><div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{averageRating.toFixed(1)}</span><span>{reviewAgg._count._all} نظر</span><span className="inline-flex items-center gap-1"><Package className="h-4 w-4" />{seller._count.products} محصول</span>{location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{location}</span>}</div>{seller.sellerBio && <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{seller.sellerBio}</p>}</div></div></Container></section>
    <Container size="xl" className="py-8 sm:py-10">
      {categories.length > 0 && <section className="mb-8"><h2 className="mb-4 text-lg font-black">دسته‌های فروشگاه</h2><div className="flex flex-wrap gap-2">{categories.map((category) => <Link key={category.id} href={`/shop/${category.slug}` as never} className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-muted">{category.name}</Link>)}</div></section>}
      <section><div className="mb-5 flex items-end justify-between gap-3"><div><h2 className="text-xl font-black">محصولات این فروشگاه</h2><p className="mt-1 text-sm text-muted-foreground">جستجو و مشاهده فقط محصولات همین فروشگاه</p></div><div className="text-xs font-semibold text-muted-foreground">{products.length} مورد</div></div><StoreProductSearch products={storeProducts} locale={locale} /></section>
    </Container>
  </main><SiteFooter /></div>;
}
