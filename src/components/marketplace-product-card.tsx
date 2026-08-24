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

export function MarketplaceProductCard({ product, currency = 'AFN', locale = 'fa', whatsappNumber, view = 'grid', showDescription = false }: MarketplaceProductCardProps) {
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
  const waLink = waNumber ? `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${tProduct('actions.whatsappMessage')} \"${product.name}\"`)}` : null;
  const canQuickAdd = product.inStock !== false;
  const handleAddToCart = () => { if (!canQuickAdd) return; addItem({ slug: product.slug, name: product.name, price: product.price, region: product.region, categoryKey: product.categoryKey, images: product.images, quantity: 1 }); };
  const rail = view === 'rail';
  const showMeta = view !== 'rail';
  const imageSizes = view === 'rail' ? '(max-width: 639px) 28vw, (max-width: 1024px) 154px, 166px' : view === 'list' ? '160px' : '(max-width: 639px) 31vw, (max-width: 1024px) 25vw, 20vw';

  const imageBlock = (
    <div className={cn('relative aspect-[16/9] w-full overflow-hidden bg-muted', view === 'list' && 'aspect-auto h-32 w-32 sm:h-40 sm:w-40', rail && 'aspect-[3/2]')}>
      {image ? <Image src={image} alt={product.images?.[0]?.alt || product.name} fill sizes={imageSizes} loading="lazy" className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.035]" /> : <div className="flex h-full items-center justify-center bg-muted"><ShoppingCart className="h-6 w-6 text-muted-foreground/25" aria-hidden="true" /></div>}
      {discountPct > 0 && <span className="absolute start-1.5 top-1.5 rounded-full bg-price-sale px-1.5 py-1 text-[8px] font-extrabold text-white shadow-sm sm:px-2 sm:text-[9px]">-{discountPct}٪</span>}
      {product.badge && discountPct === 0 && <span className="absolute start-1.5 top-1.5 rounded-full bg-price-warning px-1.5 py-1 text-[8px] font-extrabold text-white shadow-sm sm:px-2 sm:text-[9px]">{product.badge === 'new' ? tCard('badgeNew') : product.badge === 'best' ? tCard('badgeBest') : product.badge === 'last' ? tCard('badgeLast') : tCard('badgeSale')}</span>}
      {product.videoUrl && <span className="absolute end-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-md bg-foreground/80 px-1 py-0.5 text-[8px] font-bold text-background sm:text-[9px]"><Video className="h-2.5 w-2.5" aria-hidden="true" />Video</span>}
      {product.inStock === false && <span className="absolute inset-x-1.5 bottom-1.5 rounded-md bg-black/65 px-1 py-1 text-center text-[8px] font-bold text-white sm:text-[9px]">{locale === 'en' ? 'Out of stock' : locale === 'ps' ? 'په ذخیره کې نشته' : 'ناموجود'}</span>}
    </div>
  );

  return <article className={cn('group relative min-w-0 overflow-hidden rounded-2xl border border-border/65 bg-card shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-premium', rail ? 'flex w-[calc((100vw-3.25rem)/3.15)] max-w-[172px] flex-none flex-col sm:w-[160px] md:w-[172px]' : view === 'list' ? 'flex flex-row' : 'flex h-full min-h-0 flex-col')}>
    <div className={cn('relative', view === 'list' ? 'shrink-0' : 'w-full')}><Link href={`/shop/${product.slug}` as never} className="block">{imageBlock}</Link><WishlistButton slug={product.slug} productId={product.id} size="sm" labelOn={tCard('wishlistLabel')} labelOff={tCard('wishlistLabel')} className={cn('absolute end-1.5 top-1.5 z-10 border border-border/50 bg-card/90 shadow-sm backdrop-blur-sm', rail ? 'h-7 w-7' : 'h-8 w-8')} /></div>
    <div className={cn('min-w-0', view === 'list' ? 'flex flex-1 flex-col justify-center gap-2 p-3 sm:p-4' : rail ? 'flex flex-1 flex-col gap-1 px-2 pb-2 pt-1.5' : 'flex flex-1 flex-col gap-1 p-2 sm:p-2.5')}>
      <p className={cn('truncate font-bold uppercase tracking-wider text-primary', rail ? 'h-3 text-[7px]' : 'h-3.5 text-[9px] sm:h-4 sm:text-[10px]')}>{categoryLabel}</p>
      <h3 className={cn('font-bold leading-tight text-foreground', view === 'list' ? 'line-clamp-2 text-sm sm:text-base' : rail ? 'line-clamp-2 min-h-7 text-[9px] sm:min-h-8 sm:text-[10px]' : 'line-clamp-2 min-h-8 text-[11px] sm:min-h-9 sm:text-sm')}><Link href={`/shop/${product.slug}` as never} className="transition-colors hover:text-primary">{product.name}</Link></h3>
      {showMeta && product.sellerId && product.sellerShopName ? <Link href={`/store/${product.sellerId}` as never} className="flex min-w-0 items-center gap-1 text-[9px] font-semibold text-muted-foreground transition-colors hover:text-primary sm:gap-1.5 sm:text-[11px]"><Store className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" aria-hidden="true" /><span className="truncate">{product.sellerShopName}</span></Link> : null}
      {showDescription && !rail && product.shortDescription ? <p className="line-clamp-1 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">{product.shortDescription}</p> : null}
      {showMeta && product.region ? <div className="flex min-w-0 items-center gap-1 text-[9px] text-muted-foreground sm:text-[10px]"><MapPin className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" aria-hidden="true" /><span className="truncate">{product.region}</span></div> : null}
      {showMeta && <div className="flex h-4 items-center gap-0.5 sm:h-4" aria-label={rating > 0 ? `${rating.toFixed(1)}/5` : undefined}>{rating > 0 ? <>{[0,1,2,3,4].map((i) => <Star key={i} className={cn('h-2.5 w-2.5 sm:h-3 sm:w-3', i < Math.round(rating) ? 'fill-price-warning text-price-warning' : 'fill-muted text-muted-foreground')} aria-hidden="true" />)}{reviewCount > 0 ? <span className="ms-1 text-[9px] text-muted-foreground sm:text-[10px]">({reviewCount.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR')})</span> : null}</> : null}</div>}
      <div className="mt-auto flex min-w-0 items-center justify-between gap-1.5 border-t border-border/60 pt-1.5 sm:gap-2">
        <div className="flex min-w-0 flex-col"><span className={cn('truncate text-[8px] text-muted-foreground sm:text-[10px]', originalPrice ? 'line-through' : 'hidden')}>{originalPrice ? formatPrice(originalPrice, currency, locale) : '0'}</span><span className={cn('truncate font-extrabold leading-none', discountPct > 0 ? 'text-price-current' : 'text-foreground', view === 'list' ? 'text-base sm:text-lg' : rail ? 'text-[10px] sm:text-[11px]' : 'text-[12px] sm:text-sm')}>{formatPrice(product.price, currency, locale)}</span></div>
        <div className="flex shrink-0 items-center gap-1">{waLink ? <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label={`${tCard('whatsappLabel')} — ${product.name}`} className={cn('flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/50', rail ? 'h-7 w-7' : 'h-8 w-8')}><MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /></a> : null}<button type="button" onClick={handleAddToCart} disabled={!canQuickAdd} aria-label={tCard('addToCart')} className={cn('flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary/50', rail ? 'h-7 w-7' : 'h-8 w-8')}><ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">{locale === 'en' ? 'Add' : locale === 'ps' ? 'اضافه' : 'افزودن'}</span></button></div>
      </div>
    </div>
  </article>;
}
