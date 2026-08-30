import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { Container } from '@/components/layout/container';
import { Package, Store, Tags } from 'lucide-react';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };
type StoreRow = { id: string; fullName: string; shopName: string | null; bio: string | null; logoUrl: string | null; bannerUrl: string | null; city: string | null; country: string | null };
type CategoryRow = { id: string; key: string; name: string; productCount: number };
type ProductRow = { slug: string; name: string; price: string; compareAtPrice: string | null; imagesJson: unknown; categoryName: string; categoryKey: string };

function imagesOf(value: unknown): string[] { if (!Array.isArray(value)) return []; return value.filter((v): v is string => typeof v === 'string'); }

async function loadStore(id: string) {
  if (!isDatabaseConfigured()) return { unavailable: true as const };
  const stores = await prisma.$queryRaw<StoreRow[]>(Prisma.sql`SELECT "id","fullName","sellerShopName" AS "shopName","sellerBio" AS "bio","sellerLogoUrl" AS "logoUrl","sellerBannerUrl" AS "bannerUrl","sellerCity" AS "city","sellerCountry" AS "country" FROM "User" WHERE "id"=${id} AND "role"='seller' AND "isActive"=true LIMIT 1`);
  if (!stores[0]) return null;
  const [categories, products] = await Promise.all([
    prisma.$queryRaw<CategoryRow[]>(Prisma.sql`SELECT c."id",c."key",c."name",COUNT(p."id")::int AS "productCount" FROM "Product" p JOIN "Category" c ON c."id"=p."categoryId" WHERE p."sellerId"=${id} AND p."isActive"=true GROUP BY c."id",c."key",c."name" ORDER BY COUNT(p."id") DESC,c."name" ASC LIMIT 24`),
    prisma.$queryRaw<ProductRow[]>(Prisma.sql`SELECT p."slug",p."name",p."price"::text,p."compareAtPrice"::text,p."imagesJson",c."name" AS "categoryName",c."key" AS "categoryKey" FROM "Product" p JOIN "Category" c ON c."id"=p."categoryId" WHERE p."sellerId"=${id} AND p."isActive"=true ORDER BY p."createdAt" DESC,p."id" ASC LIMIT 60`),
  ]);
  return { unavailable: false as const, store: stores[0], categories, products };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> { const { id } = await params; const data = await loadStore(id); if (!data || data.unavailable) return { title: 'فروشگاه | ایشاپ' }; if (!data.store) return { title: 'فروشگاه پیدا نشد | ایشاپ' }; return { title: `${data.store.shopName ?? data.store.fullName} | ایشاپ`, description: data.store.bio ?? `فروشگاه ${data.store.shopName ?? data.store.fullName}` }; }

export default async function StorePage({ params }: Props) {
  const { locale, id } = await params;
  const data = await loadStore(id);
  if (data?.unavailable) return <><SiteHeader /><main className="min-h-dvh"><Container size="lg" className="py-20 text-center"><Store className="mx-auto h-10 w-10 text-amber-600" /><h1 className="mt-4 text-xl font-black">فروشگاه موقتاً در دسترس نیست</h1><p className="mt-2 text-sm text-muted-foreground">اتصال به پایگاه داده برقرار نشد.</p></Container></main><SiteFooter /></>;
  if (!data?.store) notFound();
  const store = data.store;
  return <div className="min-h-dvh bg-background"><SiteHeader /><main className="pb-20 md:pb-0"><Container size="xl" className="py-4 sm:py-6">
    <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
      <div className="relative h-36 bg-muted sm:h-48">{store.bannerUrl ? <Image src={store.bannerUrl} alt="" fill priority sizes="100vw" className="object-cover" /> : <div className="h-full bg-gradient-to-br from-primary/20 via-muted to-muted" />}<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /></div>
      <div className="relative px-4 pb-5 sm:px-6"><div className="-mt-10 flex items-end gap-3"><div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-background shadow-lg">{store.logoUrl ? <Image src={store.logoUrl} alt={store.shopName ?? store.fullName} fill sizes="80px" className="object-cover" /> : <div className="flex h-full items-center justify-center bg-primary text-2xl font-black text-primary-foreground">{(store.shopName ?? store.fullName).charAt(0)}</div>}</div><div className="min-w-0 pb-1"><h1 className="truncate text-xl font-black sm:text-2xl">{store.shopName ?? store.fullName}</h1><p className="mt-1 text-xs text-muted-foreground">{store.city ? `${store.city}${store.country ? `، ${store.country}` : ''}` : 'فروشگاه فروشنده'}</p></div></div>{store.bio ? <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{store.bio}</p> : null}<div className="mt-4 flex flex-wrap gap-2"><Link href={`/brand/${id}` as never} className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-bold text-primary"><Tags className="h-3.5 w-3.5" />مشاهده برند اختصاصی</Link><span className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground"><Package className="h-3.5 w-3.5" />{data.products.length.toLocaleString('fa-AF')} محصول</span></div></div>
    </section>

    <nav aria-label="دسته‌های فروشگاه" className="sticky top-[7.2rem] z-30 mt-4 overflow-x-auto rounded-2xl border border-border bg-card/95 p-2 shadow-sm backdrop-blur-xl"><div className="flex w-max items-center gap-2">{data.categories.map((category) => <Link key={category.id} href={`/shop?category=${encodeURIComponent(category.key)}` as never} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold whitespace-nowrap transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"><span>{category.name}</span><span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{category.productCount.toLocaleString('fa-AF')}</span></Link>)}</div></nav>

    <section className="mt-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">محصولات فروشگاه</h2><span className="text-xs text-muted-foreground">نمایش سریع و یکپارچه</span></div>{data.products.length === 0 ? <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">هنوز محصولی در این فروشگاه ثبت نشده است.</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{data.products.map((product) => { const image = imagesOf(product.imagesJson)[0]; const price = Number(product.price); const compare = product.compareAtPrice ? Number(product.compareAtPrice) : null; return <Link key={product.slug} href={`/shop/${product.slug}` as never} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"><div className="relative aspect-square bg-muted">{image ? <Image src={image} alt={product.name} fill sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,20vw" className="object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><Package className="h-7 w-7" /></div>}</div><div className="p-3"><span className="text-[10px] font-semibold text-primary">{product.categoryName}</span><h3 className="mt-1 line-clamp-2 text-sm font-bold group-hover:text-primary">{product.name}</h3><div className="mt-2 flex items-end gap-2"><span className="text-sm font-black num-ltr">{price.toLocaleString('fa-AF')} افغانی</span>{compare && compare > price ? <span className="text-[10px] text-muted-foreground line-through">{compare.toLocaleString('fa-AF')}</span> : null}</div></div></Link>; })}</div>}</section>
  </Container></main><SiteFooter /><BottomNavigation /></div>;
}
