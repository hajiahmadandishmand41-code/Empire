'use client';

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ImageOff, MapPin, MessageCircle, ShoppingCart, Star, Store } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { ProductSummary } from '@/types';
import { useCartStore } from '@/features/cart/store/cart-store';
import { WishlistButton } from '@/features/wishlist/components/wishlist-button';

interface ShopProductCardProps {
  product: ProductSummary;
  currency?: string;
  locale?: string;
  whatsappNumber?: string;
  view?: 'grid' | 'list';
}

export function ShopProductCard({ product, currency = 'AFN', locale = 'fa', whatsappNumber, view = 'grid' }: ShopProductCardProps) {
  const tCard = useTranslations('shop.card');
  const tCat = useTranslations('home.categories.items');
  const tProduct = useTranslations('product');
  const addItem = useCartStore((state) => state.addItem);
  const { name, shortDescription, categoryKey, price, badge, region } = product;
  const badgeLabel = badge === 'new' ? tCard('badgeNew') : badge === 'best' ? tCard('badgeBest') : badge === 'last' ? tCard('badgeLast') : badge === 'sale' ? tCard('badgeSale') : null;
  const categoryLabel = (() => { try { return tCat(`${categoryKey}.title` as Parameters<typeof tCat>[0]); } catch { return categoryKey; } })();
  const discountPct = product.comparePrice && product.comparePrice > price ? Math.round(((product.comparePrice - price) / product.comparePrice) * 100) : 0;
  const originalPrice = product.comparePrice && product.comparePrice > price ? product.comparePrice : null;
  const waLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${tProduct('actions.whatsappMessage')} "${name}"`)}` : null;
  const rating = product.averageRating ?? 0;
  const reviewCount = product.reviewCount ?? 0;

  const handleAddToCart = () => {
    if (product.inStock === false) return;
    addItem({ slug: product.slug, name: product.name, price: product.price, region: product.region, categoryKey: product.categoryKey, images: product.images, quantity: 1 });
  };

  const image = product.images[0]?.src;
  const imageBlock = (
    <div className={cn('relative overflow-hidden bg-muted', view === 'list' ? 'h-32 w-32 shrink-0 sm:h-40 sm:w-40' : 'aspect-[4/3] w-full')}>
      {image ? <Image src={image} alt={product.images[0]?.alt || name} fill sizes={view === 'list' ? '160px' : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'} className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><ImageOff className="h-10 w-10 opacity-30" aria-hidden /></div>}
      {discountPct > 0 && <span className="absolute start-2 top-2 rounded-lg bg-price-sale px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow-sm sm:px-2 sm:py-1 sm:text-[10px]">-{discountPct}٪</span>}
      {badgeLabel && discountPct === 0 && <span className="absolute start-2 top-2 rounded-lg bg-price-warning px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow-sm sm:px-2 sm:py-1 sm:text-[10px]">{badgeLabel}</span>}
      {product.inStock === false && <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/65 px-2 py-1 text-center text-[9px] font-bold text-white">{locale === 'en' ? 'Out of stock' : locale === 'ps' ? 'په ذخیره کې نشته' : 'ناموجود'}</span>}
    </div>
  );

  return (
    <article className={cn('group relative min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg', view === 'list' ? 'flex flex-row' : 'flex h-full flex-col')}>
      <div className={cn('relative', view === 'list' ? 'shrink-0' : 'w-full')}>
        <Link href={`/shop/${product.slug}` as never} className="block">{imageBlock}</Link>
        <WishlistButton slug={product.slug} productId={product.id} size="sm" labelOn={tCard('wishlistLabel')} labelOff={tCard('wishlistLabel')} className="absolute end-2 top-2 z-10 border-0 bg-card/90 backdrop-blur-sm" />
      </div>

      <div className={cn('min-w-0', view === 'list' ? 'flex flex-1 flex-col justify-center gap-2 p-3 sm:p-4' : 'flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-4')}>
        <p className="truncate text-[9px] font-bold uppercase tracking-wider text-primary sm:text-[10px]">{categoryLabel}</p>
        <h3 className={cn('font-bold leading-snug text-foreground', view === 'list' ? 'line-clamp-2 text-sm sm:text-base' : 'line-clamp-2 text-[12px] sm:text-sm')}><Link href={`/shop/${product.slug}` as never} className="transition-colors hover:text-primary">{name}</Link></h3>
        {product.sellerId && product.sellerShopName && <Link href={`/store/${product.sellerId}` as never} className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-primary sm:text-[11px]"><Store className="h-3 w-3 shrink-0" aria-hidden /><span className="truncate">{product.sellerShopName}</span></Link>}
        {shortDescription && <p className={cn('text-xs leading-relaxed text-muted-foreground', view === 'list' ? 'line-clamp-2' : 'hidden sm:line-clamp-2')}>{shortDescription}</p>}
        {region && <div className={cn('min-w-0 items-center gap-1 text-[10px] text-muted-foreground', view === 'list' ? 'flex' : 'hidden sm:flex')}><MapPin className="h-3 w-3 shrink-0" aria-hidden /><span className="truncate">{region}</span></div>}
        {rating > 0 && <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)}/5`}>{[...Array(5)].map((_, i) => <Star key={i} className={cn('h-2.5 w-2.5 sm:h-3 sm:w-3', i < Math.round(rating) ? 'fill-price-warning text-price-warning' : 'fill-muted text-muted-foreground')} aria-hidden />)}{reviewCount > 0 && <span className="ms-1 text-[9px] text-muted-foreground sm:text-[10px]">({reviewCount.toLocaleString(locale === 'en' ? 'en-US' : 'fa-IR')})</span>}</div>}
        {product.inStock !== undefined && <p className={cn('text-[9px] font-semibold sm:text-[10px]', product.inStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>{product.inStock ? (locale === 'en' ? 'In stock' : locale === 'ps' ? 'په ذخیره کې' : 'موجود') : (locale === 'en' ? 'Out of stock' : locale === 'ps' ? 'ناموجود' : 'ناموجود')}</p>}

        <div className={cn('mt-auto flex min-w-0 gap-2 border-t border-border/60 pt-2.5 sm:pt-3', view === 'list' ? 'items-center justify-between' : 'items-end justify-between')}>
          <div className="flex min-w-0 flex-col gap-0.5"><span className={cn('truncate font-extrabold', discountPct > 0 ? 'text-price-current' : 'text-foreground', view === 'list' ? 'text-base sm:text-lg' : 'text-[13px] sm:text-sm')}>{formatPrice(price, currency, locale)}</span>{originalPrice && <span className="truncate text-[9px] text-muted-foreground line-through sm:text-[10px]">{formatPrice(originalPrice, currency, locale)}</span>}</div>
          <div className="flex shrink-0 items-center gap-1.5">
            {waLink && <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label={`${tCard('whatsappLabel')} — ${name}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600"><MessageCircle className="h-3.5 w-3.5" aria-hidden /></a>}
            <button type="button" onClick={handleAddToCart} disabled={product.inStock === false} aria-label={tCard('addToCart')} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"><ShoppingCart className="h-3.5 w-3.5" aria-hidden /><span className="hidden sm:inline">{tCard('addToCart')}</span></button>
          </div>
        </div>
      </div>
    </article>
  );
}
