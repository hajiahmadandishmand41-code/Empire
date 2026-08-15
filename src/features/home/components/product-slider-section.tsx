'use client';

import * as React from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Package, Star, ShoppingCart, Heart, Share2, MessageCircle, Tag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

/* ── Types ── */
export interface SliderProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  images?: Array<{ url: string }>;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  viewCount?: number;
  category?: { name: string };
  sellerId?: string | null;
  sellerShopName?: string | null;
  sellerWhatsapp?: string;
}

interface ProductSliderSectionProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  accentColor?: string;
  products: SliderProduct[];
  locale?: string;
  currency?: string;
  skeleton?: boolean;
}

/* ── Shimmer Skeleton Card ── */
export function SkeletonCard() {
  return (
    <div
      className="w-[160px] flex-none sm:w-[180px] md:w-[200px] overflow-hidden rounded-xl border border-border bg-card"
      aria-hidden="true"
    >
      <div className="aspect-square relative overflow-hidden bg-muted">
        <div className="absolute inset-0 skeleton" />
      </div>
      <div className="flex flex-col gap-2 p-3">
        <div className="h-2 w-16 rounded skeleton" />
        <div className="h-3 w-full rounded skeleton" />
        <div className="h-3 w-3/4 rounded skeleton" />
        <div className="flex items-center gap-1 mt-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-2.5 w-2.5 rounded skeleton" />
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-border pt-2.5">
          <div className="h-4 w-16 rounded skeleton" />
          <div className="h-7 w-14 rounded-lg skeleton" />
        </div>
      </div>
    </div>
  );
}

/* ── Slider Product Card ── */
function SliderProductCard({
  product,
  locale = 'fa',
  currency = 'AFN',
}: {
  product: SliderProduct;
  locale?: string;
  currency?: string;
}) {
  const image = product.images?.[0]?.url;
  const discountPct =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  const waLink = product.sellerWhatsapp
    ? `https://wa.me/${product.sellerWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`سلام، درباره محصول "${product.name}" می‌خواستم بیشتر بدانم`)}`
    : null;

  function handleShare() {
    const url = `${window.location.origin}/shop/${product.slug}`;
    if (navigator.share) {
      navigator.share({ title: product.name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toast.success('لینک محصول کپی شد');
      }).catch(() => {});
    }
  }

  return (
    <article className="group relative w-[160px] flex-none sm:w-[180px] md:w-[200px] flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-all duration-250 hover:border-rose-200 dark:hover:border-rose-800/60 hover:shadow-lg hover:shadow-rose-500/5 hover:-translate-y-0.5">
      {/* Discount badge */}
      {discountPct > 0 && (
        <span className="absolute start-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
          <Tag className="h-2 w-2" aria-hidden /> -{discountPct}٪
        </span>
      )}

      {/* New badge */}
      {product.badge === 'new' && !discountPct && (
        <span className="absolute start-2 top-2 z-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
          جدید
        </span>
      )}

      {/* Action buttons */}
      <div className="absolute end-2 top-2 z-10 flex flex-col gap-1.5 translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 rtl:translate-x-1 rtl:group-hover:translate-x-0 ltr:-translate-x-1 ltr:group-hover:translate-x-0">
        <button
          type="button"
          aria-label="افزودن به علاقه‌مندی‌ها"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-card/95 text-muted-foreground shadow-sm hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-border/50 transition-all hover:scale-110"
        >
          <Heart className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="اشتراک‌گذاری"
          onClick={handleShare}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-card/95 text-muted-foreground shadow-sm hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-border/50 transition-all hover:scale-110"
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      {/* Image */}
      <Link href={`/shop/${product.slug}`} tabIndex={-1} aria-hidden className="block overflow-hidden">
        <div className="relative aspect-square w-full bg-muted">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, 200px"
              className="object-cover transition-transform duration-400 group-hover:scale-107"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
              <Package className="h-10 w-10 text-muted-foreground/25" aria-hidden />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.category && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
            {product.category.name}
          </p>
        )}
        <h3 className="line-clamp-2 text-xs font-bold leading-snug text-foreground">
          <Link href={`/shop/${product.slug}`} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
            {product.name}
          </Link>
        </h3>
        {product.sellerId && product.sellerShopName && (
          <Link
            href={`/store/${product.sellerId}`}
            className="flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-rose-600 truncate"
          >
            <span className="shrink-0 font-semibold">فروشگاه:</span>
            <span className="truncate">{product.sellerShopName}</span>
          </Link>
        )}

        {/* Rating */}
        {(product.rating ?? 0) > 0 && (
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn('h-2.5 w-2.5', i < Math.round(product.rating!) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground')}
                aria-hidden="true"
              />
            ))}
            {(product.reviewCount ?? 0) > 0 && (
              <span className="text-[9px] text-muted-foreground ms-0.5">({product.reviewCount})</span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between gap-1 border-t border-border/60 pt-2.5">
          <div className="flex flex-col min-w-0">
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-[9px] text-muted-foreground line-through">
                {formatPrice(product.comparePrice, currency, locale)}
              </span>
            )}
            <span className={cn('text-xs font-extrabold', discountPct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground')}>
              {formatPrice(product.price, currency, locale)}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="تماس واتساپ"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm hover:-translate-y-0.5"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
            <Link
              href={`/shop/${product.slug}`}
              aria-label={`مشاهده ${product.name}`}
              className="flex items-center gap-1 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:from-rose-600 hover:to-rose-700 transition-all shadow-sm hover:-translate-y-0.5 active:scale-95"
            >
              <ShoppingCart className="h-3 w-3" aria-hidden />
              خرید
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── Main Section ── */
export function ProductSliderSection({
  title,
  subtitle,
  viewAllHref,
  accentColor = 'bg-rose-600',
  products,
  locale = 'fa',
  currency = 'AFN',
  skeleton = false,
}: ProductSliderSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(true);

  const CARD_WIDTH = 200 + 12;

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const atStart = Math.abs(el.scrollLeft) < 5;
    const atEnd = Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 5;
    setCanScrollStart(!atStart);
    setCanScrollEnd(!atEnd);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, products]);

  function scrollBy(dir: 'start' | 'end') {
    const el = trackRef.current;
    if (!el) return;
    const delta = dir === 'end' ? CARD_WIDTH * 3 : -CARD_WIDTH * 3;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }

  if (products.length === 0 && !skeleton) return null;

  return (
    <section className="border-b border-border bg-background py-6 sm:py-8" aria-label={title}>
      <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
        {/* ── Header ── */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn('h-5 w-1 rounded-full shadow-sm bg-gradient-to-b', accentColor, 'to-transparent')} aria-hidden />
            <div>
              <h2 className="text-sm font-extrabold text-foreground sm:text-base">{title}</h2>
              {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Scroll arrows */}
            <button
              type="button"
              onClick={() => scrollBy('start')}
              disabled={!canScrollStart}
              aria-label="اسکرول به راست"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card text-foreground shadow-sm transition-all hover:border-rose-300 dark:hover:border-rose-700 hover:bg-muted disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollBy('end')}
              disabled={!canScrollEnd}
              aria-label="اسکرول به چپ"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card text-foreground shadow-sm transition-all hover:border-rose-300 dark:hover:border-rose-700 hover:bg-muted disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>

            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="ms-1 flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-3 py-2 text-[11px] font-semibold text-foreground shadow-sm hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-600 dark:hover:text-rose-400 transition-all hover:-translate-y-0.5"
              >
                همه
                <ArrowLeft className="h-3 w-3" aria-hidden />
              </Link>
            )}
          </div>
        </div>

        {/* ── Track ── */}
        <div
          ref={trackRef}
          className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-3 px-3 sm:-mx-6 sm:px-6"
          dir="rtl"
        >
          {skeleton
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((p) => (
                <SliderProductCard key={p.id} product={p} locale={locale} currency={currency} />
              ))
          }
        </div>
      </div>
    </section>
  );
}
