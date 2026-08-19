'use client';

import * as React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Star } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { ProductSummary } from '@/types';

export function HomepageHeroCarousel({ products, locale = 'fa', currency = 'AFN' }: { products: ProductSummary[]; locale?: string; currency?: string }) {
  const [index, setIndex] = React.useState(0);
  const count = Math.min(products.length, 2);

  React.useEffect(() => {
    if (count < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), 4500);
    return () => window.clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  const product = products[index] ?? products[0];
  const image = product.images?.[0]?.src ?? null;
  const discount = product.comparePrice && product.comparePrice > product.price ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;

  return (
    <section aria-label={locale === 'en' ? 'Featured products' : locale === 'ps' ? 'غوره محصولات' : 'محصولات منتخب'} className="mx-auto max-w-screen-xl px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="relative overflow-hidden rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 shadow-sm dark:border-rose-900/40 dark:from-rose-950/30 dark:via-gray-950 dark:to-amber-950/20">
        <div className="absolute -end-16 -top-16 h-40 w-40 rounded-full bg-rose-200/30 blur-3xl dark:bg-rose-800/15" aria-hidden />
        <div className="absolute -bottom-20 -start-10 h-44 w-44 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-800/10" aria-hidden />

        <div className="relative grid min-h-[230px] items-center gap-4 p-4 sm:grid-cols-[1.05fr_.95fr] sm:p-6">
          <div className="order-2 space-y-3 sm:order-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-[10px] font-extrabold text-rose-600 backdrop-blur-sm dark:border-rose-800 dark:bg-gray-900/70 dark:text-rose-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {locale === 'en' ? 'Editor spotlight' : locale === 'ps' ? 'ځانګړی انتخاب' : 'انتخاب ویژه'}
            </div>
            <h2 className="line-clamp-2 text-xl font-black leading-tight text-gray-900 dark:text-white sm:text-3xl">{product.name}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              {product.averageRating > 0 && <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{product.averageRating.toFixed(1)}</span>}
              {product.sellerShopName && <span className="truncate">{product.sellerShopName}</span>}
            </div>
            <div className="flex items-end gap-2">
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">{formatPrice(product.price, currency, locale)}</span>
              {product.comparePrice && product.comparePrice > product.price && <span className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice, currency, locale)}</span>}
              {discount > 0 && <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">-{discount}٪</span>}
            </div>
            <Link href={`/shop/${product.slug}` as never} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-gray-900">
              {locale === 'en' ? 'View product' : locale === 'ps' ? 'محصول وګورئ' : 'مشاهده کالا'}
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            </Link>
          </div>

          <div className="order-1 flex items-center justify-center sm:order-2">
            <Link href={`/shop/${product.slug}` as never} className="relative block aspect-[1.2/1] w-full max-w-[330px] overflow-hidden rounded-3xl bg-white shadow-md dark:bg-gray-900">
              {image ? <Image src={image} alt={product.name} fill sizes="(max-width: 640px) 92vw, 330px" className="object-cover transition-transform duration-700 hover:scale-105" priority={index === 0} /> : <div className="flex h-full items-center justify-center"><Sparkles className="h-14 w-14 text-rose-300" /></div>}
            </Link>
          </div>
        </div>

        {count > 1 && <>
          <button type="button" onClick={() => setIndex((value) => (value - 1 + count) % count)} aria-label="Previous" className="absolute start-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/85"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>
          <button type="button" onClick={() => setIndex((value) => (value + 1) % count)} aria-label="Next" className="absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/85"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>
          <div className="absolute bottom-3 start-1/2 flex -translate-x-1/2 gap-1.5" role="tablist" aria-label="Slides">
            {Array.from({ length: count }).map((_, dot) => <button key={dot} type="button" onClick={() => setIndex(dot)} aria-label={`Slide ${dot + 1}`} aria-selected={index === dot} className={cn('h-1.5 rounded-full transition-all', index === dot ? 'w-6 bg-rose-600' : 'w-1.5 bg-rose-200 dark:bg-rose-800')} />)}
          </div>
        </>}
      </div>
    </section>
  );
}
