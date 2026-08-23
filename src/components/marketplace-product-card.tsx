'use client';

import Image from 'next/image';
import { Link } from '@/i18n/routing';
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
  const waLink = waNumber ? `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${tProduct('actions.whatsappMessage')} "${product.name}"`)}` : null;
  const canQuickAdd = product.inStock !== false;
  const handleAddToCart = () => { if (!canQuickAdd) return; addItem({ slug: product.slug, name: product.name, price: product.price, region: product.region, categoryKey: product.categoryKey, images: product.images, quantity: 1 }); };
  const imageSizes = view === 'rail' ? '(max-width: 640px) 156px, (max-width: 1024px) 176px, 196px' : view === 'list' ? '160px' : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';

  const imageBlock = <div className={cn('relative overflow-hidden bg-muted', view === 'rail' ? 'aspect-[3/4] w-full' : view === 'list' ? 'h-32 w-32 shrink-0 sm:h-40 sm:w-40' : 'aspect-[4/3] w-full')}>
    {image ? <Image src={image} alt={product.images?.[0]?.alt || product.name} fill sizes={imageSizes} loading="lazy" className={cn('transition-transform duration-500 ease-out group-hover:scale-[1.035]', view === 'rail' ? 'object-contain p-1' : 'object-cover')} /> : <div className="flex h-full items-center justify-center bg-muted"><ShoppingCart className="h-9 w-9 text-muted-foreground/25" aria-hidden="true" /></div>}
    {discountPct > 0 && <span className="absolute start-2 top-2 rounded-lg bg-price-sale px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow-sm sm:px-2 sm:py-1 sm:text-[10px]">-{discountPct}٪</span>}
    {product.badge && discountPct === 0 && <span className="absolute start-2 top-2 rounded-lg bg-price-warning px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow-sm">{product.badge === 'new' ? tCard('badgeNew') : product.badge === 'best' ? tCard('badgeBest') : product.badge === 'last' ? tCard('badgeLast') : tCard('badgeSale')}</span>}
    {product.videoUrl && <span className="absolute end-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-foreground/80 px-1.5 py-0.5 text-[9px] font-bold text-background"><Video className="h-2.5 w-2.5" aria-hidden="true" />Video</span>}
    {product.inStock === false && <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/65 px-2 py-1 text-center text-[9px] font-bold text-white">{locale === 'en' ? 'Out of stock' : locale === 'ps' ? 'په ذخیره کې نشته' : 'ناموجود'}</span>}
  </div>;

  return <article className={cn('group relative min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg', view === 'rail' ? 'flex w-[156px] flex-none flex-col sm:w-[176px] md:w-[196px]' : view === 'list' ? 'flex flex-row' : 'flex h-full flex-col')}>
    <div className={cn('relative', view === 'list' ? 'shrink-0' : 'w-full')}><Link href={`/shop/${product.slug}` as never} className="block">{imageBlock}</Link><WishlistButton slug={product.slug} productId={product.id} size="sm" labelOn={tCard('wishlistLabel')} labelOff={tCard('wishlistLabel')} className="absolute end-2 top-2 z-10 border-0 bg-card/90 backdrop-blur-sm" /></div>
    <div className={cn('min-w-0', view === 'list' ? 'flex flex-1 flex-col justify-center gap-2 p-3 sm:p-4' : view === 'rail' ? 'flex flex-1 flex-col gap-1.5 p-3' : 'flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-4')}>
      <p className="truncate text-[9px] font-bold uppercase tracking-wider text-primary sm:text-[10px]">{categoryLabel}</p>
      <h3 className={cn('font-bold leading-snug text-foreground', view === 'list' ? 'line-clamp-2 text-sm sm:text-base' : view === 'rail' ? 'line-clamp-2 text-xs font-extrabold leading-5' : 'line-clamp-2 text-[12px] sm:text-sm')}><Link href={`/shop/${product.slug}` as never} className="transition-colors hover:text-primary">{product.name}</Link></h3>
      {product.sellerId && product.sellerShopName && <Link href={`/store/${product.sellerId}` as never} className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-primary sm:text-[11px]"><Store className="h-3 w-3 shrink-0" aria-hidden="true" /><span className="truncate">{product.sellerShopName}</span></Link>}
      {showDescription && product.shortDescription && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{product.shortDescription}</p>}
      {product.region && <div className={cn('min-w-0 items-center gap-1 text-[10px] text-muted-foreground', view === 'rail' ? 'hidden' : 'flex')}><MapPin className="h-3 w-3 shrink-0" aria-hidden="true" /><span className="truncate">{product.region}</span></div>}
      {rating > 0 && <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)}/5`}>{[0,1,2,3,4].map((i) => <Star key={i} className={cn('h-2.5 w-2.5 sm:h-3 sm:w-3', i < Math.round(rating) ? 'fill-price-warning text-price-warning' : 'fill-muted text-muted-foreground')} aria-hidden="true" />)}{reviewCount > 0 && <span className="ms-1 text-[9px] text-muted-foreground sm:text-[10px]">({reviewCount.toLocaleString(locale === 'en' ? 'en-US' : 'fa-IR')})</span>}</div>}
      <div className={cn('mt-auto flex min-w-0 gap-2 border-t border-border/60 pt-2.5', view === 'list' ? 'items-center justify-between' : 'items-end justify-between')}>
        <div className="flex min-w-0 flex-col gap-0.5">{originalPrice && <span className="truncate text-[9px] text-muted-foreground line-through sm:text-[10px]">{formatPrice(originalPrice, currency, locale)}</span>}<span className={cn('truncate font-extrabold', discountPct > 0 ? 'text-price-current' : 'text-foreground', view === 'rail' ? 'text-sm' : view === 'list' ? 'text-base sm:text-lg' : 'text-[13px] sm:text-sm')}>{formatPrice(product.price, currency, locale)}</span></div>
        <div className="flex shrink-0 items-center gap-1.5">{waLink && <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label={`${tCard('whatsappLabel')} — ${product.name}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600"><MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /></a>}<button type="button" onClick={handleAddToCart} disabled={!canQuickAdd} aria-label={tCard('addToCart')} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"><ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" /><span className="hidden sm:inline">{view === 'rail' ? (locale === 'en' ? 'Add' : locale === 'ps' ? 'اضافه' : 'افزودن') : tCard('addToCart')}</span></button></div>
      </div>
    </div>
  </article>;
}
