import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ChevronRight, Star, ShieldCheck, Truck, RotateCcw, Check, Tag, MapPin, MessageCircle, Store } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Stack } from '@/components/layout/stack';
import { formatPrice, cn } from '@/lib/utils';
import { ProductGallery } from './product-gallery';
import { ProductActions } from './product-actions';
import { RelatedProducts } from './related-products';
import { WishlistButton } from '@/features/wishlist';
import { ReviewList, ReviewForm } from '@/features/reviews';
import { ProductShare } from './product-share';
import { ProductVideoPlayer } from './product-video-player';
import type { Product, ProductSummary } from '@/types';

interface ProductDetailProps { product: Product; related: ProductSummary[]; locale: string; currency?: string; }

export async function ProductDetail({ product, related, locale, currency = 'AFN' }: ProductDetailProps) {
  const tNav = await getTranslations('nav');
  const tProduct = await getTranslations('product');
  const tCard = await getTranslations('shop.card');
  const tCat = await getTranslations('home.categories.items');
  const { name, price, badge, region, categoryKey, description, features, sellerWhatsapp } = product;

  const badgeLabel = badge === 'new' ? tCard('badgeNew') : badge === 'best' ? tCard('badgeBest') : badge === 'last' ? tCard('badgeLast') : badge === 'sale' ? tCard('badgeSale') : null;
  const categoryLabel = tCat(`${categoryKey}.title`);
  const discountPct = product.comparePrice && product.comparePrice > price ? Math.round(((product.comparePrice - price) / product.comparePrice) * 100) : 0;
  const originalPrice = product.comparePrice && product.comparePrice > price ? product.comparePrice : null;
  const avgRating = product.averageRating ?? 0;
  const reviewCount = product.reviewCount ?? 0;
  const fullStars = Math.round(avgRating);

  return <>
    <Container size="xl" className="py-4 sm:py-6 lg:py-8">
      <nav aria-label={tProduct('breadcrumb.label')} className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:mb-5">
        <Link href={`/${locale}` as never} className="transition-colors hover:text-primary">{tNav('home')}</Link><ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
        <Link href={`/${locale}/shop` as never} className="transition-colors hover:text-primary">{tNav('shop')}</Link><ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /><span className="line-clamp-1 font-semibold text-foreground">{name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-10">
        <div className="min-w-0"><ProductGallery productName={name} images={product.images} /></div>
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <Stack gap="4">
            <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-semibold text-foreground"><Tag className="h-3 w-3 text-primary" aria-hidden />{categoryLabel}</span>{badgeLabel && <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold text-white', badge === 'sale' ? 'bg-price-sale' : badge === 'new' ? 'bg-violet-600' : 'bg-price-warning')}>{badgeLabel}</span>}{discountPct > 0 && <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">{discountPct}{tProduct('discountSuffix')}</span>}</div>
            <h1 className="font-display text-2xl font-black leading-snug tracking-tight text-foreground sm:text-3xl lg:text-4xl">{name}</h1>
            {product.sellerId && product.sellerShopName && <Link href={`/store/${product.sellerId}` as never} className="flex w-fit items-center gap-2 rounded-xl border border-primary/15 bg-accent px-3 py-2 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/80"><Store className="h-4 w-4" aria-hidden /><span>{product.sellerShopName}</span></Link>}
            <div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-1" aria-label={tProduct('ratingLabel', { rating: avgRating.toFixed(1) })}>{[...Array(5)].map((_, i) => <Star key={i} className={cn('h-4 w-4', i < fullStars && avgRating > 0 ? 'fill-price-warning text-price-warning' : 'text-muted-foreground/30')} aria-hidden="true" />)}</div>{avgRating > 0 && <span className="text-sm font-bold text-foreground">{avgRating.toFixed(1)}</span>}{reviewCount > 0 && <span className="text-sm text-muted-foreground">({reviewCount} {tProduct('reviews')})</span>}<span className="text-muted-foreground/40">·</span><div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3 text-primary" aria-hidden /><span>{tProduct('madeIn')} <span className="font-bold text-foreground">{region}</span></span></div></div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-premium"><div className="flex items-end justify-between gap-4"><div className="flex min-w-0 flex-col gap-1">{originalPrice && <span className="text-sm text-muted-foreground line-through num-ltr">{formatPrice(originalPrice, currency, locale)}</span>}<span className={cn('font-display text-3xl font-black num-ltr sm:text-4xl', discountPct > 0 ? 'text-price-current' : 'text-foreground')}>{formatPrice(price, currency, locale)}</span></div><div className="flex flex-col items-end gap-1.5"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">{tProduct('shippingIncluded')}</span>{product.inStock ? <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">● {tProduct('inStock')}</span> : <span className="text-xs font-semibold text-red-500">● {tProduct('outOfStock')}</span>}</div></div></div>
            {product.shortDescription && <p className="text-sm leading-7 text-muted-foreground">{product.shortDescription}</p>}
            {(description ?? []).length > 0 && <div className="space-y-2 text-sm leading-7 text-muted-foreground">{(description ?? []).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>}
            {(features ?? []).length > 0 && <div className="rounded-2xl border border-border bg-muted/30 p-4"><h2 className="mb-3 text-xs font-bold tracking-wide text-foreground">{tProduct('features.title')}</h2><ul className="grid gap-2 sm:grid-cols-2">{(features ?? []).map((feature, i) => <li key={i} className="flex items-start gap-2 text-xs leading-5 text-foreground/80"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden /><span>{feature}</span></li>)}</ul></div>}
            <div className="grid grid-cols-3 gap-2">{[{ Icon: ShieldCheck, label: tProduct('trustBadges.authentic') }, { Icon: Truck, label: tProduct('trustBadges.shipping') }, { Icon: RotateCcw, label: tProduct('trustBadges.returns') }].map(({ Icon, label }) => <div key={label} className="card-luxury flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-2 py-3 text-center"><Icon className="h-5 w-5 text-primary" aria-hidden /><span className="text-[10px] font-bold leading-tight text-foreground">{label}</span></div>)}</div>
            {product.videoUrl && <ProductVideoPlayer videoUrl={product.videoUrl} productName={name} />}
            {sellerWhatsapp && <a href={`https://wa.me/${sellerWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${tProduct('actions.whatsappMessage')} "${name}"`)}`} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 py-3.5 font-bold text-white shadow-sm transition-[transform,box-shadow] duration-180 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"><MessageCircle className="h-5 w-5" aria-hidden /><span className="text-sm font-extrabold">{tProduct('contactWhatsapp')}</span></a>}
            <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-card p-2 shadow-premium"><div className="min-w-0 flex-1"><ProductActions productName={name} product={{ slug: product.slug, name: product.name, price: product.price, region: product.region, categoryKey: product.categoryKey, images: product.images }} /></div><WishlistButton slug={product.slug} size="lg" className="mt-0.5" /></div>
            <ProductShare productName={name} productSlug={product.slug} locale={locale} />
          </Stack>
        </div>
      </div>
    </Container>
    <div className="border-t border-border bg-background"><Container size="xl" className="py-8 sm:py-10"><div className="grid gap-8 lg:grid-cols-[1fr_360px]"><ReviewList slug={product.slug} /><ReviewForm slug={product.slug} /></div></Container></div>
    <div className="bg-background"><Container size="xl" className="py-8 sm:py-10"><RelatedProducts products={related} locale={locale} currency={currency} /></Container></div>
    <div className="fixed inset-x-3 bottom-3 z-30 flex items-center gap-2 rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-xl md:hidden"><div className="min-w-0 flex-1 px-2"><span className="block truncate text-[10px] text-muted-foreground">{name}</span><span className="block truncate text-sm font-black text-price-current">{formatPrice(price, currency, locale)}</span></div><div className="min-w-[150px] flex-1"><ProductActions productName={name} product={{ slug: product.slug, name: product.name, price: product.price, region: product.region, categoryKey: product.categoryKey, images: product.images }} /></div></div>
  </>;
}
