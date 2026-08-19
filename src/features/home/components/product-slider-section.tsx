'use client';

import * as React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ChevronLeft, ChevronRight, Heart, Package, ShoppingCart, Star } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

export interface SliderProduct { id: string; name: string; slug: string; price: number; comparePrice?: number | null; images?: Array<{ url: string }>; badge?: string; rating?: number; reviewCount?: number; salesCount?: number; viewCount?: number; category?: { name: string }; sellerId?: string | null; sellerShopName?: string | null; sellerWhatsapp?: string; }
interface ProductSliderSectionProps { title: string; subtitle?: string; viewAllHref?: string; accentColor?: string; products: SliderProduct[]; locale?: string; currency?: string; skeleton?: boolean; }

export function SkeletonCard() { return <div className="w-[168px] flex-none overflow-hidden rounded-2xl border border-border bg-card sm:w-[188px] md:w-[204px]"><div className="aspect-square animate-pulse bg-muted" /><div className="space-y-2 p-3"><div className="h-2 w-16 animate-pulse rounded bg-muted" /><div className="h-3 w-full animate-pulse rounded bg-muted" /><div className="h-3 w-3/4 animate-pulse rounded bg-muted" /><div className="h-7 w-20 animate-pulse rounded bg-muted" /></div></div>; }

function SliderProductCard({ product, locale = 'fa', currency = 'AFN' }: { product: SliderProduct; locale?: string; currency?: string }) {
  const image = product.images?.[0]?.url;
  const discountPct = product.comparePrice && product.comparePrice > product.price ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const buyLabel = locale === 'en' ? 'Quick add' : locale === 'ps' ? 'چټک پېرود' : 'افزودن سریع';
  const salesLabel = locale === 'en' ? 'sold' : locale === 'ps' ? 'پلور' : 'فروش';

  return <article className="card-luxury group w-[168px] flex-none overflow-hidden rounded-2xl border border-border/80 bg-card sm:w-[188px] md:w-[204px]">
    <div className="relative">
      <Link href={`/shop/${product.slug}` as never} className="relative block aspect-square overflow-hidden bg-muted">
        {image ? <Image src={image} alt={product.name} fill sizes="204px" className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]" /> : <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-muted-foreground/30" /></div>}
        {discountPct > 0 && <span className="absolute start-2 top-2 rounded-full bg-price-sale px-2 py-1 text-[10px] font-bold text-white shadow-sm">-{discountPct}٪</span>}
      </Link>
      <Link href="/wishlist" aria-label={locale === 'en' ? 'Wishlist' : locale === 'ps' ? 'خوښې' : 'افزودن به علاقه‌مندی‌ها'} className="absolute end-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/90 text-gray-700 shadow-sm backdrop-blur-sm transition-[transform,color,background-color] duration-150 hover:scale-105 hover:text-primary dark:border-border dark:bg-gray-900/90 dark:text-gray-200"><Heart className="h-4 w-4" aria-hidden /></Link>
      <span className="pointer-events-none absolute inset-x-2 bottom-2 translate-y-2 rounded-xl bg-black/75 px-3 py-2 text-center text-[10px] font-bold text-white opacity-0 backdrop-blur-sm transition-[opacity,transform] duration-180 group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">{buyLabel}</span>
    </div>

    <div className="flex flex-col gap-1.5 p-3">
      {product.category && <p className="truncate text-[10px] font-bold text-primary">{product.category.name}</p>}
      <Link href={`/shop/${product.slug}` as never} className="line-clamp-2 text-xs font-extrabold leading-5 text-foreground hover:text-primary">{product.name}</Link>
      {product.sellerShopName && <Link href={`/store/${product.sellerId}` as never} className="truncate text-[10px] text-muted-foreground hover:text-primary">{product.sellerShopName}</Link>}
      {(product.rating ?? 0) > 0 && <div className="flex items-center gap-1" aria-label={`${product.rating}/5`}>{[0,1,2,3,4].map((i) => <Star key={i} className={cn('h-2.5 w-2.5', i < Math.round(product.rating!) ? 'fill-price-warning text-price-warning' : 'text-muted-foreground/30')} />)}{product.reviewCount ? <span className="text-[9px] text-muted-foreground">({product.reviewCount})</span> : null}</div>}
      <div className="mt-1 border-t border-border/60 pt-2.5">
        {discountPct > 0 && product.comparePrice && <span className="block text-[10px] text-muted-foreground line-through">{formatPrice(product.comparePrice, currency, locale)}</span>}
        <div className="flex items-end justify-between gap-2"><div className="min-w-0"><span className="block truncate text-sm font-black text-price-current">{formatPrice(product.price, currency, locale)}</span>{product.salesCount ? <span className="text-[9px] text-muted-foreground">{product.salesCount.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')} {salesLabel}</span> : null}</div><Link href={`/shop/${product.slug}` as never} className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 text-[10px] font-bold text-primary-foreground shadow-sm transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-md"><ShoppingCart className="h-3 w-3" />{locale === 'en' ? 'Buy' : locale === 'ps' ? 'پېرود' : 'خرید'}</Link></div>
      </div>
    </div>
  </article>;
}

export function ProductSliderSection({ title, subtitle, viewAllHref, accentColor = 'bg-rose-600', products, locale = 'fa', currency = 'AFN', skeleton = false }: ProductSliderSectionProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => trackRef.current?.scrollBy({ left: dir * 620, behavior: 'smooth' });
  const allLabel = locale === 'en' ? 'View all' : locale === 'ps' ? 'ټول' : 'همه';
  if (products.length === 0 && !skeleton) return null;
  return <section className="border-b border-border bg-background py-6 sm:py-8" aria-label={title}><div className="mx-auto max-w-screen-xl px-3 sm:px-6"><div className="mb-4 flex items-end justify-between gap-3"><div className="flex items-center gap-2.5"><span className={cn('h-8 w-1 rounded-full', accentColor)} /><div><h2 className="text-sm font-black tracking-tight sm:text-base">{title}</h2>{subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}</div></div><div className="flex items-center gap-1.5"><button type="button" onClick={() => scroll(-1)} aria-label="Previous" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button><button type="button" onClick={() => scroll(1)} aria-label="Next" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>{viewAllHref && <Link href={viewAllHref as never} className="rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-bold transition-colors hover:bg-muted">{allLabel}</Link>}</div></div><div ref={trackRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 no-scrollbar" dir={locale === 'en' ? 'ltr' : 'rtl'}>{skeleton ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) : products.map((p) => <div key={p.id} className="snap-start"><SliderProductCard product={p} locale={locale} currency={currency} /></div>)}</div></div></section>;
}
