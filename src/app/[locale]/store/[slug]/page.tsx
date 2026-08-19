import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { Container } from '@/components/layout/container';
import { Star, MapPin, Package, Store, Sparkles } from 'lucide-react';
import { StoreProductSearch } from '@/features/store/components/store-product-search';

type Props = { params: Promise<{ locale: string; slug: string }> };
function slugify(value: string): string { return value.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, ''); }
async function getSeller(slug: string) {
  const sellers = await prisma.user.findMany({ where: { role: 'seller', sellerStatus: 'approved', isActive: true }, select: { id:true,fullName:true,sellerShopName:true,sellerBio:true,sellerLogoUrl:true,sellerBannerUrl:true,sellerCity:true,sellerCountry:true,_count:{select:{products:true,reviews:true}} }, take: 500 });
  return sellers.find(s=>s.id===slug || (s.sellerShopName ? slugify(s.sellerShopName)===slug : false)) ?? null;
}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const seller=await getSeller(slug);if(!seller)return {title:'Eshop Store'};const name=seller.sellerShopName??seller.fullName;return {title:`${name} | Eshop`,description:seller.sellerBio??`${name} — Eshop storefront`};}

export default async function SellerStorefront({params}:Props){
  const {locale,slug}=await params; setRequestLocale(locale); const seller=await getSeller(slug); if(!seller) notFound();
  const products=await prisma.product.findMany({where:{sellerId:seller.id,isActive:true},include:{category:true},orderBy:[{salesCount:'desc'},{createdAt:'desc'}],take:60});
  const reviewAgg=await prisma.review.aggregate({where:{product:{sellerId:seller.id},isApproved:true},_avg:{rating:true},_count:{_all:true}});
  const averageRating=reviewAgg._avg.rating??0; const location=[seller.sellerCity,seller.sellerCountry].filter(Boolean).join(', ');
  const categories=Array.from(new Map(products.map(p=>[p.category.id,{id:p.category.id,name:p.category.name,slug:p.category.slug}])).values());
  const popular=products.slice(0,8); const newest=[...products].sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime()).slice(0,8); const offers=products.filter(p=>p.compareAtPrice&&p.compareAtPrice.toNumber()>p.price.toNumber()).slice(0,8);
  const toCard=(p:any)=>{const image=Array.isArray(p.imagesJson)?(p.imagesJson as Array<{src?:string;url?:string}>)[0]:null;return {id:p.id,name:p.name,price:Number(p.price),imageUrl:image?.src??image?.url??null,categoryName:p.category.name};};
  const cardSet=(items:any[])=>items.map(toCard);
  const name=seller.sellerShopName??seller.fullName;
  return <div className="min-h-dvh bg-background"><SiteHeader/><main id="main">
    <section className="relative overflow-hidden border-b border-border bg-muted/30"><div className="relative h-52 w-full sm:h-72 lg:h-80">{seller.sellerBannerUrl?<Image src={seller.sellerBannerUrl} alt={`${name} banner`} fill className="object-cover" priority sizes="100vw"/>:<div className="h-full w-full bg-gradient-to-br from-primary via-emerald-700 to-slate-950"/>}<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"/></div><Container size="xl" className="relative -mt-16 pb-7 sm:-mt-20"><div className="flex flex-col gap-4 sm:flex-row sm:items-end"><div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-background bg-card shadow-xl">{seller.sellerLogoUrl?<Image src={seller.sellerLogoUrl} alt={name} fill className="object-cover" sizes="112px"/>:<div className="flex h-full w-full items-center justify-center bg-primary text-4xl font-black text-primary-foreground">{name.charAt(0)}</div>}</div><div className="min-w-0 flex-1 rounded-3xl bg-background/90 p-4 shadow-lg backdrop-blur"><div className="flex flex-wrap items-center gap-2"><Store className="h-5 w-5 text-primary"/><h1 className="truncate text-2xl font-black sm:text-3xl">{name}</h1><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">تأییدشده</span></div><div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400"/>{averageRating.toFixed(1)}</span><span>{reviewAgg._count._all} نظر</span><span className="inline-flex items-center gap-1"><Package className="h-4 w-4"/>{seller._count.products} محصول</span>{location&&<span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4"/>{location}</span>}</div>{seller.sellerBio&&<p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{seller.sellerBio}</p>}</div></div></Container></section>
    <Container size="xl" className="py-8 sm:py-10">
      {categories.length>0&&<section className="mb-10"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold text-primary">فروشگاه</p><h2 className="text-xl font-black">دسته‌های این فروشگاه</h2></div><span className="text-xs text-muted-foreground">{categories.length} دسته</span></div><div className="flex gap-2 overflow-x-auto pb-2">{categories.map(c=><Link key={c.id} href={`/category/${c.slug}`} className="shrink-0 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-bold transition hover:border-primary/40 hover:bg-primary/5">{c.name}</Link>)}</div></section>}
      {popular.length>0&&<section className="mb-10"><div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/><h2 className="text-xl font-black">پرفروش‌ترین‌های فروشگاه</h2></div><StoreProductSearch products={cardSet(popular)} locale={locale}/></section>}
      {newest.length>0&&<section className="mb-10"><div className="mb-4"><h2 className="text-xl font-black">جدیدترین محصولات</h2><p className="mt-1 text-sm text-muted-foreground">تازه‌ترین کالاهای اضافه‌شده توسط این فروشنده</p></div><StoreProductSearch products={cardSet(newest)} locale={locale}/></section>}
      {offers.length>0&&<section className="mb-10"><div className="mb-4"><h2 className="text-xl font-black">پیشنهادهای فروشگاه</h2><p className="mt-1 text-sm text-muted-foreground">محصولات دارای تخفیف در این فروشگاه</p></div><StoreProductSearch products={cardSet(offers)} locale={locale}/></section>}
      <section><div className="mb-5 flex items-end justify-between gap-3"><div><h2 className="text-xl font-black">همه محصولات فروشگاه</h2><p className="mt-1 text-sm text-muted-foreground">فقط محصولات همین فروشگاه را جستجو، فیلتر و مرور کنید.</p></div><div className="text-xs font-semibold text-muted-foreground">{products.length} مورد</div></div><StoreProductSearch products={cardSet(products)} locale={locale}/></section>
    </Container>
  </main><SiteFooter/></div>;
}
