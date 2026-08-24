'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, MessageCircle, ShoppingCart, Star, Store, Video } from 'lucide-react';
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
  showDescription = false,
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

  const image = product.images?.[0]?.src ?? null;
  const discountPct = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;
  const originalPrice = product.comparePrice && product.comparePrice > product.price
    ? product.comparePrice
    : null;
  const rating = product.averageRating ?? 0;
  const reviewCount = product.reviewCount ?? 0;
  const waNumber = whatsappNumber ?? product.sellerWhatsapp ?? null;
  const waLink = waNumber
    ? `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${tProduct('actions.whatsappMessage')} "${product.name}"`)}`
    : null;
  const canQuickAdd = product.inStock !== false;

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

  const isList = view === 'list';
  const isRail = view === 'rail';
  const showMeta = !isRail;

  const imageBlock = (
    <div className={cn(
      'relative aspect-square w-full overflow-hidden bg-muted',
      isList && 'aspect-auto h-32 w-32 sm:h-40 sm:w-40',
    )}>
      {image ? (
        <Image
          src={image}
          alt={product.images?.[0]?.alt || product.name}
          fill
          sizes={isList ? '160px' : '(max-width: 639px) 31vw, (max-width: 1024px) 24vw, 20vw'}
          loading="lazy"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-muted">
          <ShoppingCart className="h-6 w-6 text-muted-foreground/25" aria-hidden="true" />
        </div>
      )}

      {discountPct > 0 && (
        <span className="absolute start-1.5 top-1.5 rounded-full bg-price-sale px-1.5 py-1 text-[8px] font-extrabold text-white shadow-sm sm:text-[9px]">
          -{discountPct}٪
        </span>
      )}

      {product.badge && discountPct === 0 && (
        <span className="absolute start-1.5 top-1.5 rounded-full bg-price-warning px-1.5 py-1 text-[8px] font-extrabold text-white shadow-sm sm:text-[9px]">
          {product.badge === 'new'
            ? tCard('badgeNew')
            : product.badge === 'best'
              ? tCard('badgeBest')
              : product.badge === 'last'
                ? tCard('badgeLast')
                : tCard('badgeSale')}
        </span>
      )}

      {product.videoUrl && (
        <span className="absolute end-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-md bg-foreground/80 px-1 py-0.5 text-[8px] font-bold text-background">
          <Video className="h-2.5 w-2.5" aria-hidden="true" />
          Video
        </span>
      )}

      {product.inStock === false && (
        <span className="absolute inset-x-1.5 bottom-1.5 rounded-md bg-black/65 px-1 py-1 text-center text-[8px] font-bold text-white">
          {locale === 'en' ? 'Out of stock' : locale === 'ps' ? 'په ذخیره کې نشته' : 'ناموجود'}
        </span>
      )}
    </div>
  );

  const content = (
    <div className={cn(
      'min-w-0',
      isList
        ? 'flex flex-1 flex-col justify-center gap-2 p-3 sm:p-4'
        : 'flex flex-1 flex-col gap-1.5 p-2 sm:p-2.5',
    )}>
      <p className="h-3.5 truncate text-[9px] font-bold uppercase tracking-wider text-primary sm:text-[10px]">
        {categoryLabel}
      </p>

      <h3 className={cn(
        'font-bold leading-tight text-foreground',
        isList ? 'line-clamp-2 text-sm sm:text-base' : 'line-clamp-2 min-h-8 text-[11px] sm:min-h-9 sm:text-sm',
      )}>
        <Link href={`/shop/${product.slug}` as never} className="transition-colors hover:text-primary">
          {product.name}
        </Link>
      </h3>

      {showMeta && product.sellerId && product.sellerShopName ? (
        <Link
          href={`/store/${product.sellerId}` as never}
          className="flex min-w-0 items-center gap-1 text-[9px] font-semibold text-muted-foreground transition-colors hover:text-primary sm:text-[10px]"
        >
          <Store className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{product.sellerShopName}</span>
        </Link>
      ) : null}

      {showDescription && !isRail && product.shortDescription ? (
        <p className="line-clamp-1 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
          {product.shortDescription}
        </p>
      ) : null}

      {showMeta && product.region ? (
        <div className="flex min-w-0 items-center gap-1 text-[9px] text-muted-foreground sm:text-[10px]">
          <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{product.region}</span>
        </div>
      ) : null}

      {showMeta && (
        <div className="flex h-4 items-center gap-0.5" aria-label={rating > 0 ? `${rating.toFixed(1)}/5` : undefined}>
          {rating > 0 ? (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-2.5 w-2.5 sm:h-3 sm:w-3',
                    i < Math.round(rating)
                      ? 'fill-price-warning text-price-warning'
                      : 'fill-muted text-muted-foreground',
                  )}
                  aria-hidden="true"
                />
              ))}
              {reviewCount > 0 ? (
                <span className="ms-1 text-[9px] text-muted-foreground sm:text-[10px]">
                  ({reviewCount.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR')})
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      )}

      <div className="mt-auto flex min-w-0 items-center justify-between gap-1.5 border-t border-border/60 pt-1.5">
        <div className="flex min-w-0 flex-col">
          {originalPrice ? (
            <span className="truncate text-[8px] text-muted-foreground line-through sm:text-[9px]">
              {formatPrice(originalPrice, currency, locale)}
            </span>
          ) : null}
          <span className={cn(
            'truncate font-extrabold leading-none',
            discountPct > 0 ? 'text-price-current' : 'text-foreground',
            isList ? 'text-base sm:text-lg' : 'text-[12px] sm:text-sm',
          )}>
            {formatPrice(product.price, currency, locale)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${tCard('whatsappLabel')} — ${product.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : null}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canQuickAdd}
            aria-label={tCard('addToCart')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">{locale === 'en' ? 'Add' : locale === 'ps' ? 'اضافه' : 'افزودن'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <article
      className={cn(
        'group relative min-w-0 overflow-hidden rounded-2xl border border-border/65 bg-card shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-premium',
        isList ? 'flex flex-row' : 'flex h-full flex-col',
        isRail && 'w-full',
      )}
    >
      <div className={cn('relative', isList ? 'shrink-0' : 'w-full')}>
        <Link href={`/shop/${product.slug}` as never} className="block">
          {imageBlock}
        </Link>
        <WishlistButton
          slug={product.slug}
          productId={product.id}
          size="sm"
          labelOn={tCard('wishlistLabel')}
          labelOff={tCard('wishlistLabel')}
          className="absolute end-1.5 top-1.5 z-10 h-8 w-8 border border-border/50 bg-card/90 shadow-sm backdrop-blur-sm"
        />
      </div>
      {content}
    </article>
  );
}
