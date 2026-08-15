import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import {
  ChevronRight, Star, ShieldCheck, Truck, RotateCcw,
  Check, Tag, MapPin, MessageCircle, Store,
} from 'lucide-react';
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

interface ProductDetailProps {
  product: Product;
  related: ProductSummary[];
  locale: string;
  currency?: string;
}

export async function ProductDetail({ product, related, locale, currency = 'AFN' }: ProductDetailProps) {
  const tNav = await getTranslations('nav');
  const tProduct = await getTranslations('product');
  const tCard = await getTranslations('shop.card');
  const tCat = await getTranslations('home.categories.items');

  const { name, price, badge, region, categoryKey, description, features, sellerWhatsapp } = product;

  const badgeLabel =
    badge === 'new'
      ? tCard('badgeNew')
      : badge === 'best'
        ? tCard('badgeBest')
        : badge === 'last'
          ? tCard('badgeLast')
          : badge === 'sale'
            ? tCard('badgeSale')
            : null;

  const categoryLabel = tCat(`${categoryKey}.title`);
  const discountPct =
    product.comparePrice && product.comparePrice > price
      ? Math.round(((product.comparePrice - price) / product.comparePrice) * 100)
      : 0;
  const originalPrice = product.comparePrice && product.comparePrice > price ? product.comparePrice : null;

  /* Average rating: use real data or fall back to 4.1 */
  const avgRating = product.averageRating ?? 4.1;
  const reviewCount = product.reviewCount ?? 0;
  const fullStars = Math.round(avgRating);

  return (
    <>
      <Container size="xl" className="py-4 sm:py-6 lg:py-8">
        {/* ── Breadcrumbs ── */}
        <nav
          aria-label={tProduct('breadcrumb.label')}
          className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:mb-5"
        >
          <Link href={`/${locale}`} className="transition-colors hover:text-rose-500">
            {tNav('home')}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
          <Link href={`/${locale}/shop`} className="transition-colors hover:text-rose-500">
            {tNav('shop')}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
          <span className="font-semibold text-foreground">{name}</span>
        </nav>

        {/* ── Hero — 2-col on lg ── */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
          {/* Gallery */}
          <ProductGallery productName={name} images={product.images} />

          {/* Product info column */}
          <Stack gap="4">
            {/* Category + Badge row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-semibold text-foreground">
                <Tag className="h-3 w-3 text-rose-500" aria-hidden />
                {categoryLabel}
              </span>
              {badgeLabel && (
                <span className={cn(
                  'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold text-white',
                  badge === 'sale' ? 'bg-rose-500' : badge === 'new' ? 'bg-purple-500' : 'bg-amber-500',
                )}>
                  {badgeLabel}
                </span>
              )}
              {discountPct > 0 && (
                <span className="inline-flex items-center rounded-lg bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                  {discountPct}{tProduct('discountSuffix')}
                </span>
              )}
            </div>

            {/* ── Product Title (bold, large) ── */}
            <h1 className="font-display text-2xl font-extrabold leading-snug text-foreground sm:text-3xl lg:text-4xl">
              {name}
            </h1>

            {product.sellerId && product.sellerShopName && (
              <Link
                href={`/store/${product.sellerId}`}
                className="flex w-fit items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-sm font-bold text-rose-700 transition-colors hover:border-rose-400 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-300 dark:hover:bg-rose-950/45"
              >
                <Store className="h-4 w-4" aria-hidden />
                <span>فروشگاه: {product.sellerShopName}</span>
              </Link>
            )}

            {/* ── Rating + Region row ── */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1" aria-label={tProduct('ratingLabel', { rating: avgRating.toFixed(1) })}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn('h-4 w-4', i < fullStars ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">{avgRating.toFixed(1)}</span>
              {reviewCount > 0 && (
                <span className="text-sm text-muted-foreground">({reviewCount} {tProduct('reviews')})</span>
              )}
              <span className="text-muted-foreground/40">·</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 text-rose-400" aria-hidden />
                <span>
                  {tProduct('madeIn')}{' '}
                  <span className="font-bold text-foreground">{region}</span>
                </span>
              </div>
            </div>

            {/* ── Price card (bold, prominent) ── */}
            <div className="flex items-center justify-between rounded-2xl border-2 border-border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-0.5">
                {originalPrice && (
                  <span className="text-sm text-muted-foreground line-through num-ltr">
                    {formatPrice(originalPrice, currency, locale)}
                  </span>
                )}
                <span className={cn(
                  'font-display text-3xl font-extrabold num-ltr sm:text-4xl',
                  discountPct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground',
                )}>
                  {formatPrice(price, currency, locale)}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                  {tProduct('shippingIncluded')}
                </span>
                {product.inStock ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">● {tProduct('inStock')}</span>
                ) : (
                  <span className="text-xs font-semibold text-red-500">● {tProduct('outOfStock')}</span>
                )}
              </div>
            </div>

            {/* ── Short description ── */}
            {product.shortDescription && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {product.shortDescription}
              </p>
            )}

            {/* ── Full description paragraphs ── */}
            {(description ?? []).length > 0 && (
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {(description ?? []).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            )}

            {/* ── Features list ── */}
            {(features ?? []).length > 0 && (
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">
                  {tProduct('features.title')}
                </h2>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {(features ?? []).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Trust strip ── */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { Icon: ShieldCheck, label: tProduct('trustBadges.authentic') },
                { Icon: Truck, label: tProduct('trustBadges.shipping') },
                { Icon: RotateCcw, label: tProduct('trustBadges.returns') },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card px-2 py-3 text-center shadow-sm"
                >
                  <Icon className="h-5 w-5 text-rose-500" aria-hidden />
                  <span className="text-[10px] font-bold text-foreground leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* ── Video button (if product has a video) ── */}
            {product.videoUrl && (
              <ProductVideoPlayer videoUrl={product.videoUrl} productName={name} />
            )}

            {/* ── Seller WhatsApp contact ── */}
            {sellerWhatsapp && (
              <a
                href={`https://wa.me/${sellerWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${tProduct('actions.whatsappMessage')} "${name}"`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 py-3.5 font-bold text-white shadow-sm transition-all hover:bg-[#1EBE58] hover:shadow-md active:scale-[.98]"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                <span className="text-sm font-extrabold">{tProduct('contactWhatsapp')}</span>
              </a>
            )}

            {/* ── Add to Cart + Wishlist ── */}
            <div className="flex items-start gap-2.5">
              <div className="flex-1">
                <ProductActions
                  productName={name}
                  product={{
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    region: product.region,
                    categoryKey: product.categoryKey,
                    images: product.images,
                  }}
                />
              </div>
              <WishlistButton slug={product.slug} size="lg" className="mt-0.5" />
            </div>

            {/* ── Permalink + Share ── */}
            <ProductShare
              productName={name}
              productSlug={product.slug}
              locale={locale}
            />
          </Stack>
        </div>
      </Container>

      {/* ── Reviews ── */}
      <div className="border-t border-border bg-background">
        <Container size="xl" className="py-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <ReviewList slug={product.slug} />
            <ReviewForm slug={product.slug} />
          </div>
        </Container>
      </div>

      {/* ── Related products ── */}
      <div className="bg-background">
        <Container size="xl" className="py-8 sm:py-10">
          <RelatedProducts products={related} locale={locale} currency={currency} />
        </Container>
      </div>
    </>
  );
}
