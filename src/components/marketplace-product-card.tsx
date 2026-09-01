'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, ShoppingCart, Star, Store, UserRound, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn, formatPrice } from '@/lib/utils';
import { useCartStore } from '@/features/cart/store/cart-store';
import { WishlistButton } from '@/features/wishlist/components/wishlist-button';
import type { ProductSummary } from '@/types';

export interface MarketplaceProductCardProps {
  product: ProductSummary;
  currency?: string;
  locale?: string;
  whatsappNumber?: string;
  view?: 'grid' | 'list' | 'rail';
  showDescription?: boolean;
}

export function MarketplaceProductCard({
  product,
  currency = 'AFN',
  locale = 'fa',
  whatsappNumber,
  view = 'grid',
}: MarketplaceProductCardProps) {
  const tCard = useTranslations('shop.card');
  const tCat = useTranslations('home.categories.items');
  const tProduct = useTranslations('product');
  const addItem = useCartStore((state) => state.addItem);

  const categoryLabel = (() => {
    try {
      return tCat(`${product.categoryKey}.title` as Parameters<typeof tCat>[0]);
    } catch {
      return product.categoryKey;
    }
  })();

  const image = product.images?.[0]?.src || null;
  const discountPct =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;
  const originalPrice =
    product.comparePrice && product.comparePrice > product.price ? product.comparePrice : null;
  const rating = product.averageRating ?? 0;
  const reviewCount = product.reviewCount ?? 0;
  const waNumber = whatsappNumber ?? product.sellerWhatsapp ?? null;
  const waLink = waNumber
    ? `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        `${tProduct('actions.whatsappMessage')} "${product.name}"`,
      )}`
    : null;
  const canQuickAdd = product.inStock !== false;
  const isList = view === 'list';

  const handleAddToCart = () => {
    if (!canQuickAdd) return;
    addItem({
      slug: product.slug,
      name: product.name,
      price: product.price,
      region: product.region,
      categoryKey: product.categoryKey,
      images: product.images,
      quantity: 1,
    });
  };

  return (
    <article
      data-shop-compact={isList ? 'true' : undefined}
      className={cn(
        'group relative min-w-0 overflow-hidden rounded-[1.35rem] border border-border/60 bg-card shadow-sm ring-1 ring-transparent transition-all duration-300',
        'hover:-translate-y-1 hover:border-primary/20 hover:shadow-premium hover:ring-primary/5',
        isList ? 'flex h-full flex-row' : 'flex h-full flex-col',
      )}
    >
      <div className={cn('relative shrink-0', isList ? 'h-32 w-32' : 'w-full')}>
        <Link href={`/shop/${product.slug}` as never} className="block h-full" aria-label={product.name}>
          <div
            className={cn(
              'relative h-full w-full overflow-hidden bg-muted/50',
              isList ? 'rounded-s-none' : 'aspect-[4/4.5]',
            )}
          >
            {image ? (
              <Image
                src={image}
                alt={product.images?.[0]?.alt || product.name}
                fill
                sizes={
                  isList
                    ? '128px'
                    : '(max-width: 639px) 46vw, (max-width: 1024px) 30vw, (max-width: 1536px) 22vw, 260px'
                }
                loading="lazy"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.055]"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/40">
                <ShoppingCart className="h-9 w-9 text-muted-foreground/20" />
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-70" />

            {discountPct > 0 ? (
              <span className="absolute start-2 top-2 rounded-full bg-price-sale px-2.5 py-1 text-[9px] font-black text-white shadow-lg">
                {discountPct}٪ تخفیف
              </span>
            ) : product.badge ? (
              <span className="absolute start-2 top-2 rounded-full bg-price-warning px-2.5 py-1 text-[9px] font-black text-white shadow-lg">
                {product.badge === 'new'
                  ? tCard('badgeNew')
                  : product.badge === 'best'
                    ? tCard('badgeBest')
                    : product.badge === 'last'
                      ? tCard('badgeLast')
                      : tCard('badgeSale')}
              </span>
            ) : null}

            {product.inStock === false ? (
              <span className="absolute inset-x-2 bottom-2 rounded-xl bg-black/75 px-2 py-1.5 text-center text-[9px] font-bold text-white backdrop-blur-sm">
                {locale === 'en' ? 'Out of stock' : locale === 'ps' ? 'په ذخیره کې نشته' : 'ناموجود'}
              </span>
            ) : null}
          </div>
        </Link>

        <WishlistButton
          slug={product.slug}
          productId={product.id}
          size="sm"
          labelOn={tCard('wishlistLabel')}
          labelOff={tCard('wishlistLabel')}
          className="absolute end-2 top-2 z-10 h-9 w-9 rounded-full border border-white/60 bg-card/90 shadow-md backdrop-blur-md transition-transform group-hover:scale-105"
        />
      </div>

      <div
        className={cn(
          'min-w-0',
          isList
            ? 'flex min-w-0 flex-1 flex-col justify-between gap-2 p-3'
            : 'flex min-h-[154px] flex-1 flex-col gap-2.5 p-3',
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5 text-[9px]">
          <span className="inline-flex max-w-[58%] items-center gap-1 truncate rounded-full bg-primary/7 px-2 py-1 font-bold text-primary">
            <Tag className="h-2.5 w-2.5 shrink-0" />
            {categoryLabel}
          </span>
          {product.region ? (
            <span className="min-w-0 truncate text-muted-foreground">{product.region}</span>
          ) : null}
        </div>

        <h3
          className={cn(
            'min-w-0 font-black leading-snug text-foreground',
            isList ? 'line-clamp-2 text-[11px]' : 'line-clamp-2 min-h-9 text-xs sm:text-sm',
          )}
        >
          <Link href={`/shop/${product.slug}` as never} className="transition-colors hover:text-primary">
            {product.name}
          </Link>
        </h3>

        <div className="min-w-0 space-y-1 text-[9px] text-muted-foreground">
          {product.brandName ? (
            <Link
              href={`/brands/${product.brandSlug}` as never}
              className="flex min-w-0 items-center gap-1 truncate transition-colors hover:text-primary"
            >
              <Tag className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate font-semibold">{product.brandName}</span>
            </Link>
          ) : null}
          {product.sellerShopName ? (
            <Link
              href={`/store/${product.sellerId}` as never}
              className="flex min-w-0 items-center gap-1 truncate transition-colors hover:text-primary"
            >
              <Store className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate font-semibold">{product.sellerShopName}</span>
            </Link>
          ) : null}
          {product.sellerName ? (
            <span className="flex min-w-0 items-center gap-1 truncate">
              <UserRound className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{product.sellerName}</span>
            </span>
          ) : null}
          {rating > 0 ? (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-price-warning text-price-warning" />
              <span className="font-bold text-foreground">{rating.toFixed(1)}</span>
              {reviewCount > 0 ? (
                <span>
                  ({reviewCount.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR')})
                </span>
              ) : null}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex min-w-0 items-end justify-between gap-2 border-t border-border/60 pt-2.5">
          <div className="min-w-0">
            {originalPrice ? (
              <span className="block truncate text-[8px] text-muted-foreground line-through">
                {formatPrice(originalPrice, currency, locale)}
              </span>
            ) : null}
            <span
              className={cn(
                'block truncate font-black leading-none tracking-tight',
                discountPct > 0 ? 'text-price-current' : 'text-foreground',
                isList ? 'text-xs' : 'text-sm sm:text-base',
              )}
            >
              {formatPrice(product.price, currency, locale)}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${tCard('whatsappLabel')} — ${product.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-white hover:shadow-md active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canQuickAdd}
              aria-label={tCard('addToCart')}
              className="flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-primary-foreground shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden text-[9px] font-bold sm:inline">{tCard('addToCart')}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
