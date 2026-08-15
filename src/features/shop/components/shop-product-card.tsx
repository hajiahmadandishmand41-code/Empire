'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ImageOff, MapPin, MessageCircle, ShoppingCart, Star, Store, Heart } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { ProductSummary } from '@/types';

interface ShopProductCardProps {
  product: ProductSummary;
  currency?: string;
  locale?: string;
  whatsappNumber?: string;
}

export function ShopProductCard({ product, currency = 'AFN', locale = 'fa', whatsappNumber }: ShopProductCardProps) {
  const tCard = useTranslations('shop.card');
  const tCat = useTranslations('home.categories.items');
  const tProduct = useTranslations('product');

  const { name, shortDescription, categoryKey, price, badge, region } = product;

  const badgeLabel =
    badge === 'new'  ? tCard('badgeNew')
    : badge === 'best' ? tCard('badgeBest')
    : badge === 'last' ? tCard('badgeLast')
    : badge === 'sale' ? tCard('badgeSale')
    : null;

  const categoryLabel = (() => {
    try { return tCat(`${categoryKey}.title` as Parameters<typeof tCat>[0]); } catch { return categoryKey; }
  })();

  const discountPct =
    product.comparePrice && product.comparePrice > price
      ? Math.round(((product.comparePrice - price) / product.comparePrice) * 100)
      : 0;
  const originalPrice = product.comparePrice && product.comparePrice > price
    ? product.comparePrice
    : null;

  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${tProduct('actions.whatsappMessage')} "${name}"`)}`
    : null;

  // FIX: Use actual product rating instead of hardcoded 4.5
  const rating = product.averageRating ?? 0;
  const reviewCount = product.reviewCount ?? 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-200 dark:hover:border-rose-800/60 hover:shadow-xl hover:shadow-rose-500/8">

      {/* ── Discount badge ── */}
      {discountPct > 0 && (
        <div className="absolute start-2.5 top-2.5 z-10">
          <span className="inline-flex items-center gap-0.5 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 px-2 py-0.5 text-[11px] font-extrabold text-white shadow-sm shadow-rose-500/30">
            -{discountPct}٪
          </span>
        </div>
      )}

      {/* ── Marketing badge ── */}
      {badgeLabel && !discountPct && (
        <div className="absolute start-2.5 top-2.5 z-10">
          <span className={cn(
            'inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm',
            badge === 'new'  ? 'bg-gradient-to-br from-blue-500 to-blue-600'
            : badge === 'sale' ? 'bg-gradient-to-br from-rose-500 to-rose-600'
            : 'bg-gradient-to-br from-amber-500 to-orange-500',
          )}>
            {badgeLabel}
          </span>
        </div>
      )}

      {/* ── Wishlist button ── */}
      <button
        type="button"
        aria-label={tCard('wishlistLabel')}
        className="absolute end-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-muted-foreground opacity-0 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-card hover:text-rose-500 hover:scale-110 group-hover:opacity-100"
      >
        <Heart className="h-3.5 w-3.5" aria-hidden />
      </button>

      {/* ── Image ── */}
      <Link href={`/shop/${product.slug}`} className="block overflow-hidden">
        <div className="relative aspect-[4/3] w-full bg-muted">
          {product.images[0]?.src ? (
            <Image
              src={product.images[0].src!}
              alt={product.images[0].alt || name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-108"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
              <ImageOff className="h-10 w-10 opacity-30" aria-hidden />
            </div>
          )}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Category label */}
        <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
          {categoryLabel}
        </p>

        {/* Product name */}
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
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {shortDescription}
        </p>

        {/* Region */}
        {region && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-3 w-3 text-rose-400" aria-hidden />
            <span>{region}</span>
          </div>
        )}

        {/* FIX: Rating — use actual product.averageRating, not hardcoded 4.5 */}
        {rating > 0 ? (
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-3 w-3',
                  i < Math.round(rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-muted text-muted-foreground',
                )}
                aria-hidden="true"
              />
            ))}
            {reviewCount > 0 && (
              <span className="text-[10px] text-muted-foreground ms-1">
                ({reviewCount.toLocaleString('fa-IR')})
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-muted text-muted-foreground" aria-hidden />
            ))}
          </div>
        )}

        {/* ── Price + CTA ── */}
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/60 pt-3">
          <div className="flex flex-col gap-0.5">
            {originalPrice && (
              <span className="text-[11px] text-muted-foreground line-through">
                {formatPrice(originalPrice, currency, locale)}
              </span>
            )}
            <span className={cn('font-extrabold text-sm', discountPct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground')}>
              {formatPrice(price, currency, locale)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* WhatsApp */}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${tCard('whatsappLabel')} — ${name}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition-all hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-400/30"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
            <Link
              href={`/shop/${product.slug}`}
              className="flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 px-3.5 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-rose-400/30 hover:from-rose-600 hover:to-rose-700 active:scale-95"
            >
              <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">{tCard('addToCart')}</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
