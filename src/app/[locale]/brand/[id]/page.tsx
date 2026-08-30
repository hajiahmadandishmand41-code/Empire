import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { Container } from '@/components/layout/container';
import { Package, Store } from 'lucide-react';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ locale: string; id: string }> };
type BrandRow = { sellerId: string; name: string; slug: string; description: string | null; logoUrl: string | null; bannerUrl: string | null; shopName: string | null; sellerName: string };
type ProductRow = { slug: string; name: string; price: string; imagesJson: unknown };

function firstImage(value: unknown): string | null { return Array.isArray(value) && typeof value[0] === 'string' ? value[0] : null; }
async function loadBrand(id: string) {
  if (!isDatabaseConfigured()) return { unavailable: true as const };
  const brands = await prisma.$queryRaw<BrandRow[]>(Prisma.sql`SELECT b."sellerId",b."name",b."slug",b."description",b."logoUrl",b."bannerUrl",u."sellerShopName" AS "shopName",u."fullName" AS "sellerName" FROM "SellerBrand" b JOIN "User" u ON u."id"=b."sellerId" WHERE b."sellerId"=${id} AND b."isActive"=true AND u."role"='seller' AND u."isActive"=true LIMIT 1`);
  if (!brands[0]) return null;
  const products = await prisma.$queryRaw<ProductRow[]>(Prisma.sql`SELECT "slug","name","price"::text,"imagesJson" FROM "Product" WHERE "sellerId"=${id} AND "isActive"=true ORDER BY "createdAt" DESC,"id" ASC LIMIT 60`);
  return { unavailable: false as const, brand: brands[0], products };
}
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { id } = await params; const data = await loadBrand(id); if (!data || data.unavailable) return { title: 'برند | ایشاپ' }; if (!data.brand) return { title: 'برند پیدا نشد | ایشاپ' }; return { title: `${data.brand.name} | برند ایشاپ`, description: data.brand.description ?? `برند ${data.brand.name}` }; }
export default async function BrandPage({ params }: Props) {
  const { id } = await params; const data = await loadBrand(id);
  if (data?.unavailable) return <><SiteHeader /><main className="min-h-dvh"><Container size="lg" className="py-20 text-center"><h1 className="text-xl font-black">برند موقتاً در دسترس نیست</h1><p className="mt-2 text-sm text-muted-foreground">اتصال به پایگاه داده برقرار نشد.</p></Container></main><SiteFooter /></>;
  if (!data?.brand) notFound(); const brand=data.brand;
  return <div className="min-h-dvh bg-background"><SiteHeader /><main className="pb-20 md:pb-0"><Container size="xl" className="py-4 sm:py-6"><section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm"><div className="relative h-40 sm:h-56 bg-muted">{brand.bannerUrl ? <Image src={brand.bannerUrl} alt="" fill priority sizes="100vw" className="object-cover" /> : <div className="h-full bg-gradient-to-br from-primary/20 via-muted to-muted" />}<div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" /></div><div className="px-4 pb-6 sm:px-7"><div className="-mt-11 flex items-end gap-4"><div className="relative h-22 w-22 shrink-0 overflow-hidden rounded-3xl border-4 border-card bg-background shadow-xl">{brand.logoUrl ? <Image src={brand.logoUrl} alt={brand.name} fill sizes="88px" className="object-cover" /> : <div className="flex h-full items-center justify-center bg-primary text-3xl font-black text-primary-foreground">{brand.name.charAt(0)}</div>}</div><div className="min-w-0 pb-1"><h1 className="truncate text-2xl font-black sm:text-3xl">{brand.name}</h1><p className="mt-1 text-xs text-muted-foreground">برند اختصاصی {brand.shopName ?? brand.sellerName}</p></div></div>{brand.description ? <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{brand.description}</p> : null}<Link href={`/store/${brand.sellerId}` as never} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-bold text-primary"><Store className="h-3.5 w-3.5" />مشاهده فروشگاه</Link></div></section><section className="mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">محصولات این برند</h2><span className="text-xs text-muted-foreground">{data.products.length.toLocaleString('fa-AF')} محصول</span></div>{data.products.length===0?<div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">هنوز محصولی برای این برند ثبت نشده است.</div>:<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{data.products.map((product)=><Link key={product.slug} href={`/shop/${product.slug}` as never} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"><div className="relative aspect-square bg-muted">{firstImage(product.imagesJson)?<Image src={firstImage(product.imagesJson)!} alt={product.name} fill sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,20vw" className="object-cover" loading="lazy"/>:<div className="flex h-full items-center justify-center text-muted-foreground"><Package className="h-7 w-7"/></div>}</div><div className="p-3"><h3 className="line-clamp-2 text-sm font-bold group-hover:text-primary">{product.name}</h3><p className="mt-2 text-sm font-black num-ltr">{Number(product.price).toLocaleString('fa-AF')} افغانی</p></div></Link>)}</div>}</section></Container></main><SiteFooter/><BottomNavigation/></div>;
}
