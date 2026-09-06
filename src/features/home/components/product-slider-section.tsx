'use client';

import * as React from 'react';
import { Link } from '@/i18n/routing';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryKey, ProductSummary } from '@/types';
import { MarketplaceProductCard } from '@/components/marketplace-product-card';

export interface SliderProduct {
  id: string; name: string; slug: string; price: number; comparePrice?: number | null;
  images?: Array<{ url: string }>; badge?: string; rating?: number; reviewCount?: number; salesCount?: number; viewCount?: number;
  categoryKey?: CategoryKey; category?: { name: string }; sellerId?: string | null; sellerName?: string | null; sellerShopName?: string | null;
  sellerWhatsapp?: string; region?: string; inStock?: boolean;
}

interface ProductSliderSectionProps { title: string; subtitle?: string; viewAllHref?: string; accentColor?: string; products: SliderProduct[]; locale?: string; currency?: string; skeleton?: boolean }

/**
 * Rail card sizing.
 *
 * Previously every breakpoint was locked to three cards across
 * (`calc((100vw - 2.75rem) / 3)`), which squeezed product names and prices
 * into an unreadable column on phones and left huge dead space on desktop.
 * `rail-card` scales the peek: ~2.3 cards on phones (the partial card is the
 * affordance that tells users the row scrolls), rising to 6 on large screens.
 */
const railCardClass = 'snap-start flex-none w-[42vw] xs:w-[38vw] sm:w-[30vw] md:w-[23vw] lg:w-[19vw] xl:w-[15.5rem]';

export function SkeletonCard() {
  return <div className={`${railCardClass} overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm`} aria-hidden="true"><div className="aspect-square animate-pulse bg-muted" /><div className="space-y-2 p-3"><div className="h-2.5 w-14 animate-pulse rounded bg-muted" /><div className="h-3 w-full animate-pulse rounded bg-muted" /><div className="h-3 w-3/4 animate-pulse rounded bg-muted" /><div className="h-8 w-full animate-pulse rounded-lg bg-muted" /></div></div>;
}

function toProductSummary(product: SliderProduct): ProductSummary {
  return {
    id: product.id, name: product.name, slug: product.slug, shortDescription: '', categoryKey: product.categoryKey ?? 'digital',
    price: product.price, currency: 'AFN', badge: product.badge as ProductSummary['badge'], region: product.region ?? 'افغانستان',
    images: (product.images ?? []).map((image) => ({ src: image.url, alt: product.name })), inStock: product.inStock !== false,
    sellerId: product.sellerId, sellerName: product.sellerName, sellerShopName: product.sellerShopName, sellerWhatsapp: product.sellerWhatsapp,
    averageRating: product.rating, reviewCount: product.reviewCount, salesCount: product.salesCount, viewCount: product.viewCount, comparePrice: product.comparePrice,
  };
}

export function ProductSliderSection({ title, subtitle, viewAllHref, accentColor = 'bg-rose-600', products, locale = 'fa', currency = 'AFN', skeleton = false }: ProductSliderSectionProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => trackRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' });
  const allLabel = locale === 'en' ? 'View all' : locale === 'ps' ? 'ټول' : 'همه';
  if (products.length === 0 && !skeleton) return null;
  const prevLabel = locale === 'en' ? 'Previous products' : locale === 'ps' ? 'مخکني محصولات' : 'محصولات قبلی';
  const nextLabel = locale === 'en' ? 'Next products' : locale === 'ps' ? 'راتلونکي محصولات' : 'محصولات بعدی';

  return (
    <section className="section-band" aria-label={title || undefined}>
      <div className="section-shell">
        <div className="section-head">
          <div className="flex min-w-0 items-center gap-2.5">
            {title && <span className={cn('section-accent-bar', accentColor && accentColor !== 'bg-rose-600' ? accentColor : undefined)} />}
            <div className="min-w-0">
              {title && <h2 className="section-head-title">{title}</h2>}
              {subtitle && <p className="section-head-sub">{subtitle}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={() => scroll(-1)} aria-label={prevLabel} className="rail-btn hidden sm:flex">
              <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label={nextLabel} className="rail-btn hidden sm:flex">
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </button>
            {viewAllHref && (
              <Link href={viewAllHref as never} className="section-head-action">
                {allLabel}
                <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
        <div ref={trackRef} className="rail" dir={locale === 'en' ? 'ltr' : 'rtl'}>
          {skeleton
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((product) => (
                <div key={product.id} className={railCardClass}>
                  <MarketplaceProductCard product={toProductSummary(product)} locale={locale} currency={currency} view="rail" />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
