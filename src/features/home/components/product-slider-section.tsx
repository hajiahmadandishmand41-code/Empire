'use client';

import * as React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ChevronLeft, ChevronRight, Package, ShoppingCart, Star } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

export interface SliderProduct { id: string; name: string; slug: string; price: number; comparePrice?: number | null; images?: Array<{ url: string }>; badge?: string; rating?: number; reviewCount?: number; salesCount?: number; viewCount?: number; category?: { name: string }; sellerId?: string | null; sellerShopName?: string | null; sellerWhatsapp?: string; }
interface ProductSliderSectionProps { title: string; subtitle?: string; viewAllHref?: string; accentColor?: string; products: SliderProduct[]; locale?: string; currency?: string; skeleton?: boolean; }

export function SkeletonCard() { return <div className="w-[160px] flex-none overflow-hidden rounded-xl border border-border bg-card sm:w-[180px] md:w-[200px]"><div className="aspect-square animate-pulse bg-muted" /><div className="space-y-2 p-3"><div className="h-2 w-16 animate-pulse rounded bg-muted" /><div className="h-3 w-full animate-pulse rounded bg-muted" /><div className="h-3 w-3/4 animate-pulse rounded bg-muted" /><div className="h-7 w-20 animate-pulse rounded bg-muted" /></div></div>; }

function SliderProductCard({ product, locale = 'fa', currency = 'AFN' }: { product: SliderProduct; locale?: string; currency?: string }) {
  const image = product.images?.[0]?.url;
  const discountPct = product.comparePrice && product.comparePrice > product.price ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const buyLabel = locale === 'en' ? 'Buy' : locale === 'ps' ? 'پېرود' : 'خرید';
  return <article className="group w-[160px] flex-none overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg sm:w-[180px] md:w-[200px]">
    <Link href={`/shop/${product.slug}` as never} className="relative block aspect-square overflow-hidden bg-muted">{image ? <Image src={image} alt={product.name} fill sizes="200px" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-muted-foreground/30" /></div>}{discountPct > 0 && <span className="absolute start-2 top-2 rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">-{discountPct}٪</span>}</Link>
    <div className="flex flex-col gap-1.5 p-3">{product.category && <p className="truncate text-[10px] font-bold uppercase text-rose-500">{product.category.name}</p>}<Link href={`/shop/${product.slug}` as never} className="line-clamp-2 text-xs font-extrabold leading-snug hover:text-rose-600">{product.name}</Link>{product.sellerShopName && <Link href={`/store/${product.sellerId}` as never} className="truncate text-[10px] text-muted-foreground hover:text-rose-600">{product.sellerShopName}</Link>}{(product.rating ?? 0) > 0 && <div className="flex items-center gap-0.5">{[0,1,2,3,4].map((i) => <Star key={i} className={cn('h-2.5 w-2.5', i < Math.round(product.rating!) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />)}</div>}<div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2"><span className="text-xs font-extrabold text-foreground">{formatPrice(product.price, currency, locale)}</span><Link href={`/shop/${product.slug}` as never} className="flex h-7 items-center gap-1 rounded-lg bg-rose-600 px-2.5 text-[10px] font-bold text-white"><ShoppingCart className="h-3 w-3" />{buyLabel}</Link></div></div>
  </article>;
}

export function ProductSliderSection({ title, subtitle, viewAllHref, accentColor = 'bg-rose-600', products, locale = 'fa', currency = 'AFN', skeleton = false }: ProductSliderSectionProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => trackRef.current?.scrollBy({ left: dir * 620, behavior: 'smooth' });
  const allLabel = locale === 'en' ? 'View all' : locale === 'ps' ? 'ټول' : 'همه';
  if (products.length === 0 && !skeleton) return null;
  return <section className="border-b border-border bg-background py-6 sm:py-8" aria-label={title}><div className="mx-auto max-w-screen-xl px-3 sm:px-6"><div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2.5"><span className={cn('h-5 w-1 rounded-full', accentColor)} /><div><h2 className="text-sm font-extrabold sm:text-base">{title}</h2>{subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}</div></div><div className="flex items-center gap-1.5"><button type="button" onClick={() => scroll(-1)} aria-label="Previous" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button><button type="button" onClick={() => scroll(1)} aria-label="Next" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>{viewAllHref && <Link href={viewAllHref as never} className="rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-semibold">{allLabel}</Link>}</div></div><div ref={trackRef} className="flex gap-3 overflow-x-auto pb-2 no-scrollbar" dir={locale === 'en' ? 'ltr' : 'rtl'}>{skeleton ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) : products.map((p) => <SliderProductCard key={p.id} product={p} locale={locale} currency={currency} />)}</div></div></section>;
}
