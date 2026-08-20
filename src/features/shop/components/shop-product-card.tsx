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
}

export function ShopProductCard({ product, currency = 'AFN', locale = 'fa', whatsappNumber }: ShopProductCardProps) {
  const tCard = useTranslations('shop.card');
  const tCat = useTranslations('home.categories.items');
  const tProduct = useTranslations('product');
  const addItem = useCartStore((state) => state.addItem);
  const { name, shortDescription, categoryKey, price, badge, region } = product;

  const badgeLabel =
    badge === 'new' ? tCard('badgeNew')
    : badge === 'best' ? tCard('badgeBest')
    : badge === 'last' ? tCard('badgeLast')
    : badge === 'sale' ? tCard('badgeSale')
    : null;

  const categoryLabel = (() => {
    try { return tCat(`${categoryKey}.title` as Parameters<typeof tCat>[0]); } catch { return categoryKey; }
  })();
  const discountPct = product.comparePrice && product.comparePrice > price
    ? Math.round(((product.comparePrice - price) / product.comparePrice) * 100) : 0;
  const originalPrice = product.comparePrice && product.comparePrice > price ? product.comparePrice : null;
  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${tProduct('actions.whatsappMessage')} "${name}"`)}` : null;
  const rating = product.averageRating ?? 0;
  const reviewCount = product.reviewCount ?? 0;

  const handleAddToCart = () => {
    if (product.inStock === false) return;
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
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-200 dark:hover:border-rose-800/60 hover:shadow-xl hover:shadow-rose-500/8">
      {discountPct > 0 && <div className="absolute start-2.5 top-2.5 z-10"><span className="inline-flex items-center gap-0.5 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 px-2 py-0.5 text-[11px] font-extrabold text-white shadow-sm shadow-rose-500/30">-{discountPct}٪</span></div>}
      {badgeLabel && !discountPct && <div className="absolute start-2.5 top-2.5 z-10"><span className={cn('inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm', badge === 'new' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : badge === 'sale' ? 'bg-gradient-to-br from-rose-500 to-rose-600' : 'bg-gradient-to-br from-amber-500 to-orange-500')}>{badgeLabel}</span></div>}
      <WishlistButton slug={product.slug} productId={product.id} size="sm" labelOn={tCard('wishlistLabel')} labelOff={tCard('wishlistLabel')} className="absolute end-2.5 top-2.5 z-10 border-0 bg-card/90 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100" />

      <Link href={`/shop/${product.slug}` as never} className="block min-w-0 overflow-hidden">
        <div className="relative aspect-[4/3] w-full bg-muted">
          {product.images[0]?.src ? <Image src={product.images[0].src!} alt={product.images[0].alt || name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/60"><ImageOff className="h-10 w-10 opacity-30" aria-hidden /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">{categoryLabel}</p>
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground"><Link href={`/shop/${product.slug}` as never} className="transition-colors hover:text-rose-600 dark:hover:text-rose-400">{name}</Link></h3>
        {product.sellerId && product.sellerShopName && <Link href={`/store/${product.sellerId}` as never} className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-rose-600"><Store className="h-3 w-3 shrink-0 text-rose-500" aria-hidden /><span className="truncate">{product.sellerShopName}</span></Link>}
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{shortDescription}</p>
        {region && <div className="flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="h-3 w-3 shrink-0 text-rose-400" aria-hidden /><span className="truncate">{region}</span></div>}
        {rating > 0 ? <div className="flex items-center gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={cn('h-3 w-3', i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground')} aria-hidden />)}{reviewCount > 0 && <span className="ms-1 text-[10px] text-muted-foreground">({reviewCount.toLocaleString('fa-IR')})</span>}</div> : <div className="flex items-center gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-muted text-muted-foreground" aria-hidden />)}</div>}
        <div className="mt-auto flex min-w-0 items-end justify-between gap-2 border-t border-border/60 pt-3">
          <div className="flex min-w-0 flex-col gap-0.5">{originalPrice && <span className="truncate text-[11px] text-muted-foreground line-through">{formatPrice(originalPrice, currency, locale)}</span>}<span className={cn('truncate font-extrabold text-sm', discountPct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground')}>{formatPrice(price, currency, locale)}</span></div>
          <div className="flex shrink-0 items-center gap-1.5">
            {waLink && <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label={`${tCard('whatsappLabel')} — ${name}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-md hover:shadow-emerald-400/30"><MessageCircle className="h-3.5 w-3.5" aria-hidden /></a>}
            <button type="button" onClick={handleAddToCart} disabled={product.inStock === false} aria-label={tCard('addToCart')} className="flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 px-3.5 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-rose-400/30 hover:from-rose-600 hover:to-rose-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"><ShoppingCart className="h-3.5 w-3.5" aria-hidden /><span className="hidden sm:inline">{tCard('addToCart')}</span></button>
          </div>
        </div>
      </div>
    </article>
  );
}
