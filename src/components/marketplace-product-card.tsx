'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, ShoppingCart, Star, Store, UserRound, Video } from 'lucide-react';
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

export function MarketplaceProductCard({ product, currency = 'AFN', locale = 'fa', whatsappNumber, view = 'grid' }: MarketplaceProductCardProps) {
  const tCard = useTranslations('shop.card');
  const tCat = useTranslations('home.categories.items');
  const tProduct = useTranslations('product');
  const addItem = useCartStore((state) => state.addItem);
  const categoryLabel = (() => { try { return tCat(`${product.categoryKey}.title` as Parameters<typeof tCat>[0]); } catch { return product.categoryKey; } })();
  const image = product.images?.[0]?.src ?? null;
  const discountPct = product.comparePrice && product.comparePrice > product.price ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const originalPrice = product.comparePrice && product.comparePrice > product.price ? product.comparePrice : null;
  const rating = product.averageRating ?? 0;
  const reviewCount = product.reviewCount ?? 0;
  const waNumber = whatsappNumber ?? product.sellerWhatsapp ?? null;
  const waLink = waNumber ? `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${tProduct('actions.whatsappMessage')} "${product.name}"`)}` : null;
  const canQuickAdd = product.inStock !== false;
  const isList = view === 'list';

  const handleAddToCart = () => {
    if (!canQuickAdd) return;
    addItem({ slug: product.slug, name: product.name, price: product.price, region: product.region, categoryKey: product.categoryKey, images: product.images, quantity: 1 });
  };

  return (
    <article data-shop-compact={isList ? 'true' : undefined} className={cn('group relative min-w-0 overflow-hidden rounded-2xl border border-border/65 bg-card shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-premium', isList ? 'flex h-full flex-row items-stretch' : 'flex h-full flex-col')}>
      <div className={cn('relative shrink-0', isList ? 'h-24 w-24' : 'w-full')}>
        <Link href={`/shop/${product.slug}` as never} className="block h-full"><div className={cn('relative h-full w-full overflow-hidden bg-muted', isList ? 'aspect-square' : 'aspect-square')}>
          {image ? <Image src={image} alt={product.images?.[0]?.alt || product.name} fill sizes={isList ? '96px' : '(max-width: 639px) 32vw, (max-width: 1024px) 24vw, 20vw'} loading="lazy" className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center bg-muted"><ShoppingCart className="h-6 w-6 text-muted-foreground/25" aria-hidden="true" /></div>}
          {discountPct > 0 && <span className="absolute end-1.5 top-1.5 rounded-full bg-price-sale px-1.5 py-1 text-[8px] font-extrabold text-white shadow-sm">-{discountPct}٪</span>}
          {product.badge && discountPct === 0 && <span className="absolute end-1.5 top-1.5 rounded-full bg-price-warning px-1.5 py-1 text-[8px] font-extrabold text-white shadow-sm">{product.badge === 'new' ? tCard('badgeNew') : product.badge === 'best' ? tCard('badgeBest') : product.badge === 'last' ? tCard('badgeLast') : tCard('badgeSale')}</span>}
          {product.videoUrl && <span className="absolute end-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-md bg-foreground/80 px-1 py-0.5 text-[7px] font-bold text-background"><Video className="h-2.5 w-2.5" aria-hidden="true" />ویدیو</span>}
          {product.inStock === false && <span className="absolute inset-x-1.5 bottom-1.5 rounded-md bg-black/65 px-1 py-1 text-center text-[7px] font-bold text-white">{locale === 'en' ? 'Out of stock' : locale === 'ps' ? 'په ذخیره کې نشته' : 'ناموجود'}</span>}
        </div></Link>
        <WishlistButton slug={product.slug} productId={product.id} size="sm" labelOn={tCard('wishlistLabel')} labelOff={tCard('wishlistLabel')} className="absolute start-1.5 top-1.5 z-10 h-8 w-8 border border-border/50 bg-card/90 shadow-sm backdrop-blur-sm" />
      </div>
      <div className={cn('min-w-0', isList ? 'flex min-w-0 flex-1 flex-col justify-between gap-1 p-2' : 'flex min-h-[112px] shrink-0 flex-col gap-1.5 p-2 sm:min-h-[116px] sm:p-2.5')}>
        <div className="flex min-w-0 items-center gap-1 text-[8px] leading-none sm:text-[9px]"><span className="max-w-[52%] truncate font-bold text-primary">{categoryLabel}</span><span className="text-border">•</span><span className="min-w-0 truncate text-muted-foreground">{product.region || 'افغانستان'}</span></div>
        <h3 className={cn('line-clamp-2 min-w-0 font-bold leading-tight text-foreground', isList ? 'text-[10px]' : 'h-8 text-[11px] sm:h-9 sm:text-xs')}><Link href={`/shop/${product.slug}` as never} className="transition-colors hover:text-primary">{product.name}</Link></h3>
        <div className="flex min-w-0 flex-col gap-0.5 truncate text-[8px] text-muted-foreground sm:text-[9px]">
          {product.sellerShopName ? <Link href={`/store/${product.sellerId}` as never} className="inline-flex min-w-0 items-center gap-1 truncate hover:text-primary"><Store className="h-2.5 w-2.5 shrink-0" aria-hidden="true" /><span className="truncate font-semibold">{product.sellerShopName}</span></Link> : null}
          {product.sellerName ? <span className="inline-flex min-w-0 items-center gap-1 truncate"><UserRound className="h-2.5 w-2.5 shrink-0" aria-hidden="true" /><span className="truncate">{product.sellerName}</span></span> : null}
          {rating > 0 ? <span className="inline-flex min-w-0 items-center gap-1"><Star className="h-2.5 w-2.5 shrink-0 fill-price-warning text-price-warning" aria-hidden="true" /><span>{rating.toFixed(1)}</span>{reviewCount > 0 ? <span>({reviewCount.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR')})</span> : null}</span> : null}
        </div>
        <div className="mt-auto flex min-w-0 items-center justify-between gap-1 border-t border-border/60 pt-1"><div className="flex min-w-0 flex-col">{originalPrice ? <span className="truncate text-[7px] text-muted-foreground line-through">{formatPrice(originalPrice, currency, locale)}</span> : null}<span className={cn('truncate font-extrabold leading-none', discountPct > 0 ? 'text-price-current' : 'text-foreground', isList ? 'text-[11px]' : 'text-[12px] sm:text-sm')}>{formatPrice(product.price, currency, locale)}</span></div><div className="flex shrink-0 items-center gap-1">{waLink ? <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label={`${tCard('whatsappLabel')} — ${product.name}`} className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600"><MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /></a> : null}<button type="button" onClick={handleAddToCart} disabled={!canQuickAdd} aria-label={tCard('addToCart')} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"><ShoppingCart className="h-3 w-3" aria-hidden="true" /><span className="sr-only">{locale === 'en' ? 'Add' : locale === 'ps' ? 'اضافه' : 'افزودن'}</span></button></div></div>
      </div>
    </article>
  );
}
