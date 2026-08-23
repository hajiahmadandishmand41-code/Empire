'use client';

import * as React from 'react';
import { Link } from '@/i18n/routing';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryKey, ProductSummary } from '@/types';
import { MarketplaceProductCard } from '@/components/marketplace-product-card';

export interface SliderProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  images?: Array<{ url: string }>;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  viewCount?: number;
  categoryKey?: CategoryKey;
  category?: { name: string };
  sellerId?: string | null;
  sellerShopName?: string | null;
  sellerWhatsapp?: string;
  region?: string;
  inStock?: boolean;
}

interface ProductSliderSectionProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  accentColor?: string;
  products: SliderProduct[];
  locale?: string;
  currency?: string;
  skeleton?: boolean;
}

export function SkeletonCard() {
  return <div className="w-[168px] flex-none overflow-hidden rounded-2xl border border-border bg-card sm:w-[188px] md:w-[204px]" aria-hidden="true"><div className="aspect-square animate-pulse bg-muted" /><div className="space-y-2 p-3"><div className="h-2 w-16 animate-pulse rounded bg-muted" /><div className="h-3 w-full animate-pulse rounded bg-muted" /><div className="h-3 w-3/4 animate-pulse rounded bg-muted" /><div className="h-7 w-20 animate-pulse rounded bg-muted" /></div></div>;
}

function toProductSummary(product: SliderProduct): ProductSummary {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: '',
    categoryKey: product.categoryKey ?? 'digital',
    price: product.price,
    currency: 'AFN',
    badge: product.badge as ProductSummary['badge'],
    region: product.region ?? 'افغانستان',
    images: (product.images ?? []).map((image) => ({ src: image.url, alt: product.name })),
    inStock: product.inStock !== false,
    sellerId: product.sellerId,
    sellerShopName: product.sellerShopName,
    sellerWhatsapp: product.sellerWhatsapp,
    averageRating: product.rating,
    reviewCount: product.reviewCount,
    salesCount: product.salesCount,
    viewCount: product.viewCount,
    comparePrice: product.comparePrice,
  };
}

export function ProductSliderSection({ title, subtitle, viewAllHref, accentColor = 'bg-rose-600', products, locale = 'fa', currency = 'AFN', skeleton = false }: ProductSliderSectionProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => trackRef.current?.scrollBy({ left: dir * 540, behavior: 'smooth' });
  const allLabel = locale === 'en' ? 'View all' : locale === 'ps' ? 'ټول' : 'همه';
  if (products.length === 0 && !skeleton) return null;

  return <section className="border-b border-border bg-background py-5 sm:py-7" aria-label={title || undefined}>
    <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
      <div className="mb-3.5 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {title && <span className={cn('h-7 w-1 rounded-full', accentColor)} />}
          <div className="min-w-0">{title && <h2 className="truncate text-sm font-black tracking-tight sm:text-base">{title}</h2>}{subtitle && <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground sm:text-[11px]">{subtitle}</p>}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={() => scroll(-1)} aria-label={locale === 'en' ? 'Previous products' : locale === 'ps' ? 'مخکني محصولات' : 'محصولات قبلی'} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>
          <button type="button" onClick={() => scroll(1)} aria-label={locale === 'en' ? 'Next products' : locale === 'ps' ? 'راتلونکي محصولات' : 'محصولات بعدی'} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>
          {viewAllHref && <Link href={viewAllHref as never} className="rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-bold transition-colors hover:bg-muted sm:text-[11px]">{allLabel}</Link>}
        </div>
      </div>
      <div ref={trackRef} className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 no-scrollbar" dir={locale === 'en' ? 'ltr' : 'rtl'}>
        {skeleton ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) : products.map((product) => (
          <div key={product.id} className="snap-start">
            <MarketplaceProductCard product={toProductSummary(product)} locale={locale} currency={currency} view="rail" />
          </div>
        ))}
      </div>
    </div>
  </section>;
}
