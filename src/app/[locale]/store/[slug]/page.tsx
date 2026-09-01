import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { Container } from '@/components/layout/container';
import { StoreProductSearch } from '@/features/store/components/store-product-search';
import { MapPin, Package, ShieldCheck, Store } from 'lucide-react';

type Props={params:Promise<{locale:string;slug:string}>};
type ImageValue={src?:string;url?:string};
const slugify=(v:string)=>v.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'');
const getSeller=cache(async(slug:string)=>{
 if(!isDatabaseConfigured())return null;
 const direct=await prisma.user.findFirst({where:{role:'seller',sellerStatus:'approved',isActive:true,OR:[{id:slug},{sellerShopName:{equals:slug,mode:'insensitive'}}]},select:{id:true,fullName:true,sellerShopName:true,sellerBio:true,sellerLogoUrl:true,sellerBannerUrl:true,sellerCity:true,sellerCountry:true,sellerWhatsapp:true,sellerWebsite:true}});
 if(direct)return direct;
 const candidates=await prisma.user.findMany({where:{role:'seller',sellerStatus:'approved',isActive:true,sellerShopName:{not:null}},select:{id:true,sellerShopName:true},take:500});
 const match=candidates.find(v=>v.sellerShopName&&slugify(v.sellerShopName)===slug);
 return match?prisma.user.findUnique({where:{id:match.id},select:{id:true,fullName:true,sellerShopName:true,sellerBio:true,sellerLogoUrl:true,sellerBannerUrl:true,sellerCity:true,sellerCountry:true,sellerWhatsapp:true,sellerWebsite:true}}):null;
});
export async function generateMetadata({params}:Props):Promise<Metadata>{const{slug}=await params;const seller=await getSeller(slug);const name=seller?.sellerShopName??seller?.fullName??'فروشگاه';return{title:`${name} | Eshop`,description:seller?.sellerBio??`فروشگاه ${name}`}}
export default async function StorePage({params}:Props){const{locale,slug}=await params;setRequestLocale(locale);if(!isDatabaseConfigured())return <div className="min-h-dvh bg-background"><SiteHeader/><Container size="xl" className="py-16"><div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-12 text-center text-sm font-semibold">اتصال پایگاه داده برای نمایش فروشگاه در دسترس نیست.</div></Container><SiteFooter/></div>;
 const seller=await getSeller(slug);if(!seller)notFound();const name=seller.sellerShopName??seller.fullName;
 const[products,categories,activeCount]=await Promise.all([
  prisma.product.findMany({where:{sellerId:seller.id,isActive:true},include:{category:true},orderBy:[{salesCount:'desc'},{createdAt:'desc'}],take:60}),
  prisma.category.findMany({where:{products:{some:{sellerId:seller.id,isActive:true}}},select:{id:true,name:true,slug:true},orderBy:{name:'asc'},take:30}),
  prisma.product.count({where:{sellerId:seller.id,isActive:true}})
 ]);
 const cards=products.map(product=>{const images=Array.isArray(product.imagesJson)?product.imagesJson as ImageValue[]:[];const image=images[product.primaryImageIndex]??images[0];return{id:product.id,name:product.name,price:Number(product.price),imageUrl:image?.src??image?.url??null,categoryName:product.category.name}});
 return <div className="min-h-dvh bg-background"><SiteHeader/><main id="main"><section className="border-b border-border bg-muted/20"><div className="relative h-48 sm:h-64">{seller.sellerBannerUrl?<Image src={seller.sellerBannerUrl} alt="" fill priority sizes="100vw" className="object-cover"/>:<div className="h-full w-full bg-gradient-to-br from-primary/25 via-background to-primary/5"/>}<div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"/></div><Container size="xl" className="relative -mt-14 pb-7 sm:-mt-16"><div className="flex flex-col gap-4 sm:flex-row sm:items-end"><div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-4 border-background bg-card shadow-xl">{seller.sellerLogoUrl?<Image src={seller.sellerLogoUrl} alt={name} fill sizes="96px" className="object-cover"/>:<div className="flex h-full items-center justify-center bg-primary text-3xl font-black text-primary-foreground">{name.charAt(0)}</div>}</div><div className="min-w-0 flex-1 rounded-3xl bg-background/95 p-4 shadow-lg sm:p-5"><div className="flex flex-wrap items-center gap-2"><Store className="h-5 w-5 text-primary"/><h1 className="truncate text-2xl font-black sm:text-3xl">{name}</h1><span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600"><ShieldCheck className="h-3.5 w-3.5"/>فروشنده تأییدشده</span></div><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Package className="h-4 w-4"/>{activeCount} محصول</span>{seller.sellerCity&&<span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4"/>{seller.sellerCity}{seller.sellerCountry?`, ${seller.sellerCountry}`:''}</span>}</div>{seller.sellerBio&&<p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{seller.sellerBio}</p>}</div></div></Container></section><section className="sticky top-0 z-20 border-b border-border bg-background/95 py-2 backdrop-blur"><Container size="xl"><div className="flex gap-2 overflow-x-auto no-scrollbar">{categories.map(category=><Link key={category.id} href={`/category/${category.slug}`} className="shrink-0 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold hover:border-primary/30">{category.name}</Link>)}</div></Container></section><Container size="xl" className="py-7 sm:py-9"><div className="mb-5 flex items-end justify-between gap-3"><div><h2 className="text-xl font-black sm:text-2xl">محصولات فروشگاه</h2><p className="mt-1 text-xs text-muted-foreground">همه محصولات فعال این فروشگاه با داده واقعی</p></div><Link href="/stores" className="text-xs font-bold text-primary">فروشگاه‌های دیگر</Link></div><StoreProductSearch products={cards} locale={locale}/></Container></main><SiteFooter/></div>;
}
