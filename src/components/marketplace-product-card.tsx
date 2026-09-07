'use client';

import Image from 'next/image';
import { MessageCircle, ShoppingCart, Star, Store, UserRound, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn, formatPrice } from '@/lib/utils';
import { useCartStore } from '@/features/cart/store/cart-store';
import { WishlistButton } from '@/features/wishlist/components/wishlist-button';
import { Link } from '@/i18n/routing';
import { ShapePattern } from '@/components/decorative-shapes';
import type { ProductSummary } from '@/types';

export interface MarketplaceProductCardProps {
  product: ProductSummary;
  currency?: string;
  locale?: string;
  whatsappNumber?: string;
  view?: 'grid' | 'list' | 'rail';
  showDescription?: boolean;
}

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  fa: { clothing:'پوشاک',digital:'دیجیتال',homeAppliances:'لوازم خانگی',beauty:'آرایشی و بهداشتی',sports:'ورزشی',footwear:'کفش و کتانی',baby:'کودک و نوزاد',books:'کتاب و لوازم',electronics:'الکترونیک',watches:'ساعت و اکسسوری','category-flx9pu':'پوشاک زمستانی','category-e8kw76':'پوشاک مدرن','category-i5vobj':'تلفن همراه',nuts:'خشکبار',saffron:'زعفران',gemstones:'سنگ قیمتی',handicrafts:'صنایع دستی',honey:'عسل',carpet:'قالین',localClothing:'لباس محلی',traditional:'محصولات سنتی افغانستان',driedFruits:'میوه خشک' },
  ps: { clothing:'جامې',digital:'ډیجیټل',homeAppliances:'د کور وسایل',beauty:'ښکلا او روغتیا',sports:'ورزش',footwear:'بوټان او سپورتي بوټان',baby:'ماشومان او نوي زېږېدلي',books:'کتابونه او قرطاسیه',electronics:'برېښنایي وسایل',watches:'ساعتونه او لوازم','category-flx9pu':'ژمنۍ جامې','category-e8kw76':'عصري جامې','category-i5vobj':'موبایل تلیفون',nuts:'وچ مېوې او مغزونه',saffron:'زعفران',gemstones:'قیمتي ډبرې',handicrafts:'لاسي صنایع',honey:'شات',carpet:'قالین',localClothing:'محلي جامې',traditional:'د افغانستان دودیز محصولات',driedFruits:'وچې مېوې' },
  en: { clothing:'Clothing',digital:'Digital',homeAppliances:'Home appliances',beauty:'Beauty & personal care',sports:'Sports',footwear:'Footwear & sneakers',baby:'Baby & kids',books:'Books & stationery',electronics:'Electronics',watches:'Watches & accessories','category-flx9pu':'Winter clothing','category-e8kw76':'Modern clothing','category-i5vobj':'Mobile phones',nuts:'Nuts',saffron:'Saffron',gemstones:'Gemstones',handicrafts:'Handicrafts',honey:'Honey',carpet:'Carpets',localClothing:'Traditional clothing',traditional:'Traditional Afghan products',driedFruits:'Dried fruit' },
};

const OUT_OF_STOCK: Record<string, string> = { fa: 'ناموجود', ps: 'په ذخیره کې نشته', en: 'Out of stock' };

/**
 * Marketplace product card.
 *
 * Three presentations share one data contract:
 *  - `grid` — vertical tile for the catalogue grid
 *  - `rail` — vertical tile tuned for horizontal scrollers
 *  - `list` — horizontal row (image start, details end) used by the
 *    "compare / browse" view. The horizontal layout has room for the
 *    seller, brand and rating on one line, which the vertical tile has to
 *    stack, so it reads far better on phones for long product names.
 */
export function MarketplaceProductCard({ product, currency = 'AFN', locale = 'fa', whatsappNumber, view = 'grid' }: MarketplaceProductCardProps) {
  const tCard = useTranslations('shop.card');
  const tProduct = useTranslations('product');
  const addItem = useCartStore((state) => state.addItem);

  const lang = locale === 'en' || locale === 'ps' ? locale : 'fa';
  const categoryLabel = CATEGORY_LABELS[lang]?.[product.categoryKey] ?? product.categoryKey;
  const numberLocale = lang === 'en' ? 'en-US' : lang === 'ps' ? 'ps-AF' : 'fa-IR';

  const discountPct = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;
  const originalPrice = product.comparePrice && product.comparePrice > product.price ? product.comparePrice : null;
  const rating = product.averageRating ?? 0;
  const reviewCount = product.reviewCount ?? 0;
  const waNumber = whatsappNumber ?? product.sellerWhatsapp ?? null;
  const waLink = waNumber
    ? `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${tProduct('actions.whatsappMessage')} "${product.name}"`)}`
    : null;

  const canQuickAdd = product.inStock !== false;
  const isList = view === 'list';
  // These chips used to hardcode Persian, so English and Pashto shoppers saw
  // Persian text stamped on every discounted product.
  const discountLabel = lang === 'en' ? `${discountPct}% OFF` : `${discountPct}٪ تخفیف`;
  const percentChip = lang === 'en' ? `-${discountPct}%` : `${discountPct}٪`;
  const image = product.images?.[0];

  const handleAddToCart = () => {
    if (!canQuickAdd) return;
    addItem({ slug: product.slug, name: product.name, price: product.price, region: product.region, categoryKey: product.categoryKey, images: product.images, quantity: 1 });
  };

  /* ---- shared fragments ------------------------------------------------ */

  const media = (
    <Link href={`/shop/${product.slug}` as never} className="block h-full w-full" aria-label={product.name}>
      <div className={cn('relative h-full w-full overflow-hidden bg-muted/40', isList ? '' : 'aspect-square')}>
        {image?.src ? (
          <Image
            src={image.src}
            alt={image.alt || product.name}
            fill
            sizes={isList ? '160px' : '(max-width:639px) 46vw,(max-width:1024px) 30vw,(max-width:1536px) 22vw,260px'}
            loading="lazy"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          // Deterministic graphic instead of a grey "broken image" box.
          <ShapePattern seed={product.slug || product.id} />
        )}

        {discountPct > 0 ? (
          <span className="absolute start-2 top-2 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-black text-white shadow-lg shadow-red-500/30">{discountLabel}</span>
        ) : product.badge ? (
          <span className="absolute start-2 top-2 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-black text-white shadow-lg shadow-amber-500/30">
            {product.badge === 'new' ? tCard('badgeNew') : product.badge === 'best' ? tCard('badgeBest') : product.badge === 'last' ? tCard('badgeLast') : tCard('badgeSale')}
          </span>
        ) : null}

        {product.inStock === false ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
            <span className="rounded-lg bg-black/80 px-3 py-1.5 text-[11px] font-bold text-white">{OUT_OF_STOCK[lang]}</span>
          </span>
        ) : null}
      </div>
    </Link>
  );

  const priceBlock = (
    <div className="flex min-w-0 items-baseline gap-2">
      <span className={cn('truncate font-black leading-none tracking-tight', discountPct > 0 ? 'text-price-current' : 'text-foreground', isList ? 'text-base' : 'text-sm sm:text-base')}>
        {formatPrice(product.price, currency, locale)}
      </span>
      {originalPrice ? (
        <span className="truncate text-[11px] text-muted-foreground line-through decoration-red-400/60">{formatPrice(originalPrice, currency, locale)}</span>
      ) : null}
      {discountPct > 0 ? (
        <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-black text-red-500">{percentChip}</span>
      ) : null}
    </div>
  );

  const ratingBlock = rating > 0 ? (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
      <Star className="h-3 w-3 fill-current" aria-hidden="true" />
      {rating.toFixed(1)}
      {reviewCount > 0 ? <span className="font-medium text-muted-foreground">({reviewCount.toLocaleString(numberLocale)})</span> : null}
    </span>
  ) : null;

  const cartButton = (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={!canQuickAdd}
      aria-label={tCard('addToCart')}
      className="flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-glow disabled:opacity-45"
    >
      <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate text-[11px] font-bold">{tCard('addToCart')}</span>
    </button>
  );

  const waButton = waLink ? (
    <a
      href={waLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${tCard('whatsappLabel')} — ${product.name}`}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 shadow-sm transition-all duration-200 hover:bg-emerald-500/20"
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
    </a>
  ) : null;

  const wishlist = (
    <WishlistButton
      slug={product.slug}
      productId={product.id}
      size="sm"
      labelOn={tCard('wishlistLabel')}
      labelOff={tCard('wishlistLabel')}
      className="absolute end-2 top-2 z-10 h-8 w-8 rounded-full border border-white/50 bg-card/85 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-card"
    />
  );

  /* ---- horizontal (list) ---------------------------------------------- */

  if (isList) {
    return (
      <article data-shop-compact="true" className="surface-card surface-card-interactive group relative flex min-w-0 overflow-hidden">
        <div className="relative h-auto w-[112px] shrink-0 self-stretch sm:w-[150px]">{media}</div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="inline-flex min-w-0 items-center gap-1 truncate rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              <Tag className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              {categoryLabel}
            </span>
            {ratingBlock}
          </div>

          <h3 className="line-clamp-2 min-w-0 text-[13px] font-black leading-snug text-foreground sm:text-sm">
            <Link href={`/shop/${product.slug}` as never} className="transition-colors hover:text-primary">{product.name}</Link>
          </h3>

          {/* Seller + brand share one row here — the horizontal layout has the
              width for it, which is the main readability win over the tile. */}
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {product.sellerShopName ? (
              <Link href={`/store/${product.sellerId}` as never} className="flex min-w-0 items-center gap-1 truncate hover:text-primary">
                <Store className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate font-semibold">{product.sellerShopName}</span>
              </Link>
            ) : product.sellerName ? (
              <span className="flex min-w-0 items-center gap-1 truncate"><UserRound className="h-3 w-3 shrink-0" aria-hidden="true" /><span className="truncate">{product.sellerName}</span></span>
            ) : null}
            {product.brandName ? (
              <Link href={`/brands/${product.brandSlug}` as never} className="flex min-w-0 items-center gap-1 truncate hover:text-primary">
                <Tag className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate font-semibold">{product.brandName}</span>
              </Link>
            ) : null}
            {product.region ? <span className="truncate">{product.region}</span> : null}
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-1">
            {priceBlock}
            <div className="flex w-[136px] shrink-0 items-center gap-1.5 sm:w-[170px]">{waButton}{cartButton}</div>
          </div>
        </div>
        {wishlist}
      </article>
    );
  }

  /* ---- vertical (grid / rail) ----------------------------------------- */

  return (
    <article className="surface-card surface-card-interactive group relative flex h-full min-w-0 flex-col overflow-hidden">
      <div className="relative w-full">
        {media}
        {wishlist}
      </div>

      <div className="flex min-h-[136px] flex-1 flex-col gap-1.5 p-2.5 sm:min-h-[150px] sm:p-3">
        <div className="flex min-w-0 items-center justify-between gap-1.5">
          <span className="inline-flex min-w-0 items-center gap-1 truncate rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            <Tag className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            {categoryLabel}
          </span>
          {ratingBlock}
        </div>

        <h3 className="line-clamp-2 min-w-0 text-xs font-black leading-snug text-foreground sm:text-[13px]">
          <Link href={`/shop/${product.slug}` as never} className="transition-colors hover:text-primary">{product.name}</Link>
        </h3>

        {product.sellerShopName ? (
          <Link href={`/store/${product.sellerId}` as never} className="flex min-w-0 items-center gap-1 truncate text-[11px] text-muted-foreground hover:text-primary">
            <Store className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate font-semibold">{product.sellerShopName}</span>
          </Link>
        ) : null}

        <div className="mt-auto space-y-2 pt-1">
          {priceBlock}
          <div className="flex items-center gap-1.5">{waButton}{cartButton}</div>
        </div>
      </div>
    </article>
  );
}
