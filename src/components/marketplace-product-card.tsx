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
  const imageSizes = view === 'rail' ? '(max-width: 640px) 168px, (max-width: 1024px) 188px, 204px' : view === 'list' ? '160px' : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';
  const showMeta = view !== 'rail';

  const imageBlock = <div className={cn('relative overflow-hidden bg-muted', view === 'rail' ? 'aspect-square w-full' : view === 'list' ? 'h-32 w-32 shrink-0 sm:h-40 sm:w-40' : 'aspect-square w-full')}>
    {image ? <Image src={image} alt={product.images?.[0]?.alt || product.name} fill sizes={imageSizes} loading="lazy" className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]" /> : <div className="flex h-full items-center justify-center bg-muted"><ShoppingCart className="h-9 w-9 text-muted-foreground/25" aria-hidden="true" /></div>}
    {discountPct > 0 && <span className="absolute start-2 top-2 rounded-full bg-price-sale px-2 py-1 text-[9px] font-extrabold text-white shadow-sm">-{discountPct}٪</span>}
    {product.badge && discountPct === 0 && <span className="absolute start-2 top-2 rounded-full bg-price-warning px-2 py-1 text-[9px] font-extrabold text-white shadow-sm">{product.badge === 'new' ? tCard('badgeNew') : product.badge === 'best' ? tCard('badgeBest') : product.badge === 'last' ? tCard('badgeLast') : tCard('badgeSale')}</span>}
    {product.videoUrl && <span className="absolute end-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-foreground/80 px-1.5 py-0.5 text-[9px] font-bold text-background"><Video className="h-2.5 w-2.5" aria-hidden="true" />Video</span>}
    {product.inStock === false && <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/65 px-2 py-1 text-center text-[9px] font-bold text-white">{locale === 'en' ? 'Out of stock' : locale === 'ps' ? 'په ذخیره کې نشته' : 'ناموجود'}</span>}
  </div>;
  const rail = view === 'rail';

  return <article className={cn('group relative min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md', rail ? 'flex w-[168px] flex-none flex-col sm:w-[188px] md:w-[204px]' : view === 'list' ? 'flex flex-row' : 'flex h-full min-h-0 flex-col')}>
    <div className={cn('relative', view === 'list' ? 'shrink-0' : 'w-full')}><Link href={`/shop/${product.slug}` as never} className="block">{imageBlock}</Link><WishlistButton slug={product.slug} productId={product.id} size="sm" labelOn={tCard('wishlistLabel')} labelOff={tCard('wishlistLabel')} className="absolute end-2 top-2 z-10 border-0 bg-card/90 backdrop-blur-sm" /></div>
    <div className={cn('min-w-0', view === 'list' ? 'flex flex-1 flex-col justify-center gap-2 p-3 sm:p-4' : rail ? 'flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3' : 'flex flex-1 flex-col gap-1.5 p-3 sm:p-3.5')}>
      <p className="h-4 truncate font-bold text-[9px] uppercase tracking-wider text-primary sm:text-[10px]">{categoryLabel}</p>
      <h3 className={cn('font-bold leading-snug text-foreground', view === 'list' ? 'line-clamp-2 text-sm sm:text-base' : rail ? 'line-clamp-2 min-h-9 text-[12px]' : 'line-clamp-2 min-h-9 text-[12px] sm:text-sm')}><Link href={`/shop/${product.slug}` as never} className="transition-colors hover:text-primary">{product.name}</Link></h3>
      {showMeta && product.sellerId && product.sellerShopName ? <Link href={`/store/${product.sellerId}` as never} className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-primary sm:text-[11px]"><Store className="h-3 w-3 shrink-0" aria-hidden="true" /><span className="truncate">{product.sellerShopName}</span></Link> : null}
      {showDescription && !rail && product.shortDescription ? <p className="line-clamp-1 text-[11px] leading-relaxed text-muted-foreground">{product.shortDescription}</p> : null}
      {showMeta && product.region ? <div className="flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" aria-hidden="true" /><span className="truncate">{product.region}</span></div> : null}
      {showMeta && <div className="flex h-4 items-center gap-0.5" aria-label={rating > 0 ? `${rating.toFixed(1)}/5` : undefined}>{rating > 0 ? <>{[0,1,2,3,4].map((i) => <Star key={i} className={cn('h-2.5 w-2.5 sm:h-3 sm:w-3', i < Math.round(rating) ? 'fill-price-warning text-price-warning' : 'fill-muted text-muted-foreground')} aria-hidden="true" />)}{reviewCount > 0 ? <span className="ms-1 text-[9px] text-muted-foreground sm:text-[10px]">({reviewCount.toLocaleString(locale === 'en' ? 'en-US' : 'fa-IR')})</span> : null}</> : null}</div>}
      <div className="mt-auto flex min-w-0 items-center justify-between gap-2 border-t border-border/60 pt-2">
        <div className="flex min-w-0 flex-col"><span className={cn('truncate text-[9px] text-muted-foreground sm:text-[10px]', originalPrice ? 'line-through' : 'hidden')}>{originalPrice ? formatPrice(originalPrice, currency, locale) : '0'}</span><span className={cn('truncate font-extrabold leading-none', discountPct > 0 ? 'text-price-current' : 'text-foreground', view === 'list' ? 'text-base sm:text-lg' : rail ? 'text-sm' : 'text-sm')}>{formatPrice(product.price, currency, locale)}</span></div>
        <div className="flex shrink-0 items-center gap-1.5">{waLink ? <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label={`${tCard('whatsappLabel')} — ${product.name}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600"><MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /></a> : null}<button type="button" onClick={handleAddToCart} disabled={!canQuickAdd} aria-label={tCard('addToCart')} className="flex h-8 shrink-0 items-center justify-center rounded-full bg-primary px-2.5 text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"><ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" /><span className="hidden sm:inline ms-1 text-[11px] font-bold">{locale === 'en' ? 'Add' : locale === 'ps' ? 'اضافه' : 'افزودن'}</span></button></div>
      </div>
    </div>
  </article>;
}
