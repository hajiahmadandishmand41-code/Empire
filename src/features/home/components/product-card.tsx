'use client';

import * as React from 'react';
import { ShoppingCart, Star, MessageCircle, Eye, TrendingUp, Tag, Share2, Store, Heart } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { FeaturedProduct } from '../data/featured-products';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { WishlistButton } from '@/features/wishlist';

interface ProductCardProps {
  product: FeaturedProduct;
  currency?: string;
  locale?: string;
  whatsappNumber?: string;
  salesCount?: number;
  viewCount?: number;
}

export function ProductCard({
  product,
  currency = 'AFN',
  locale = 'fa',
  whatsappNumber,
  salesCount,
  viewCount,
}: ProductCardProps) {
  const tCard = useTranslations('shop.card');
  const tProduct = useTranslations('product');
  const { name, shortDescription, price, badge, accent, Icon } = product;

  const badgeLabel =
    badge === 'new'  ? tCard('badgeNew')
    : badge === 'best' ? tCard('badgeBest')
    : badge === 'last' ? tCard('badgeLast')
    : null;

  const discountPct = badge === 'best' ? 15 : badge === 'last' ? 8 : 0;
  const originalPrice = discountPct > 0 ? Math.round(price * (1 + discountPct / 100)) : null;

  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${tProduct('actions.whatsappMessage')} "${name}"`)}`
    : null;

  function handleShare() {
    const url = `${window.location.origin}/shop/${product.slug}`;
    if (navigator.share) {
      navigator.share({ title: name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toast.success('لینک محصول کپی شد');
      }).catch(() => {});
    }
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:border-rose-200 dark:hover:border-rose-800/60 hover:shadow-xl hover:shadow-rose-500/6 card-luxury">

      {/* ── Badges ── */}
      <div className="absolute start-2.5 top-2.5 z-10 flex flex-col gap-1.5">
        {discountPct > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm shadow-rose-500/30">
            <Tag className="h-2.5 w-2.5" aria-hidden />
            -{discountPct}٪
          </span>
        )}
        {badgeLabel && !discountPct && (
          <span className={cn(
            'inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm',
            badge === 'new' ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30'
                            : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30',
          )}>
            {badgeLabel}
          </span>
        )}
      </div>

      {/* ── Action buttons (hover reveal) ── */}
      <div className="absolute end-2 top-2 z-10 flex flex-col gap-1.5 translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 focus-within:opacity-100 rtl:translate-x-1 rtl:group-hover:translate-x-0 ltr:-translate-x-1 ltr:group-hover:translate-x-0">
        <WishlistButton
          slug={product.slug}
          size="sm"
          className="shadow-sm border-border/50 hover:border-rose-300 dark:hover:border-rose-700"
          labelOn="حذف از علاقه‌مندی‌ها"
          labelOff="افزودن به علاقه‌مندی‌ها"
        />
        <button
          type="button"
          aria-label="اشتراک‌گذاری"
          onClick={handleShare}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-border/50 transition-all hover:scale-110"
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      {/* ── Image ── */}
      <Link href={`/shop/${product.slug}`} tabIndex={-1} aria-hidden className="block overflow-hidden">
        <div className="relative aspect-[4/3] w-full bg-muted">
          <div
            aria-hidden="true"
            className={cn('absolute inset-0 bg-gradient-to-br opacity-75 transition-all duration-400 group-hover:opacity-85', accent.from, accent.via, accent.to)}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.6),transparent_65%)] transition-opacity duration-300 group-hover:opacity-75"
          />
          <div className="relative flex h-full items-center justify-center p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/25 shadow-xl ring-1 ring-white/30 backdrop-blur-sm transition-all duration-400 group-hover:scale-110 group-hover:rotate-2 sm:h-24 sm:w-24">
              <Icon className="h-10 w-10 text-white drop-shadow-lg sm:h-12 sm:w-12" aria-hidden />
            </div>
          </div>
        </div>
      </Link>

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Category */}
        {product.categoryKey && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
            {product.categoryKey}
          </p>
        )}

        {/* Name */}
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
          <Link href={`/shop/${product.slug}`} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
            {name}
          </Link>
        </h3>

        {/* Seller */}
        {product.sellerId && product.sellerShopName && (
          <Link
            href={`/store/${product.sellerId}`}
            className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-rose-600"
          >
            <Store className="h-3 w-3 shrink-0 text-rose-500" aria-hidden />
            <span className="truncate">{product.sellerShopName}</span>
          </Link>
        )}

        {/* Description */}
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{shortDescription}</p>

        {/* Sales / views */}
        {(salesCount !== undefined || viewCount !== undefined) && (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {salesCount !== undefined && salesCount > 0 && (
              <span className="flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                {salesCount} فروش
              </span>
            )}
            {viewCount !== undefined && viewCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3 text-blue-400" />
                {viewCount}
              </span>
            )}
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn('h-3 w-3', i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground')}
              aria-hidden="true"
            />
          ))}
          <span className="text-[10px] text-muted-foreground ms-1">(۴.۵)</span>
        </div>

        {/* ── Price + CTA ── */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            {originalPrice && (
              <span className="text-[10px] text-muted-foreground line-through">
                {formatPrice(originalPrice, currency, locale)}
              </span>
            )}
            <span className={cn(
              'font-extrabold text-sm',
              discountPct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground',
            )}>
              {formatPrice(price, currency, locale)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={tCard('whatsappLabel')}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm hover:-translate-y-0.5 hover:shadow-emerald-400/30"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
            <Link
              href={`/shop/${product.slug}`}
              aria-label={`${tCard('viewProduct')} — ${name}`}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:from-rose-600 hover:to-rose-700 transition-all shadow-sm hover:-translate-y-0.5 hover:shadow-rose-400/30 active:scale-95"
            >
              <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
              {tCard('addToCart')}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
