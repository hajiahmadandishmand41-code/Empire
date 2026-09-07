'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Flame, Grid2X2, Rows3, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { MarketplaceProductCard } from '@/components/marketplace-product-card';
import type { ProductSummary } from '@/types';

type Locale = 'fa' | 'ps' | 'en';

const COPY: Record<Locale, { all: string; grid: string; list: string; prev: string; next: string }> = {
  fa: { all: 'مشاهده همه', grid: 'نمایش شبکه‌ای', list: 'نمایش فهرستی', prev: 'قبلی', next: 'بعدی' },
  ps: { all: 'ټول وګورئ', grid: 'د شبکې بڼه', list: 'د لیست بڼه', prev: 'مخکینی', next: 'راتلونکی' },
  en: { all: 'View all', grid: 'Grid view', list: 'List view', prev: 'Previous', next: 'Next' },
};

export type ShowcaseLayout = 'rail' | 'grid' | 'list' | 'switchable';

/**
 * Icons are selected by key rather than passed as components: this is a
 * client component, and React cannot serialise a function prop across the
 * server/client boundary (it throws "Functions cannot be passed directly to
 * Client Components").
 */
const ICONS = { flame: Flame, trending: TrendingUp, sparkles: Sparkles } as const;
export type ShowcaseIcon = keyof typeof ICONS;

/**
 * One product band, three ways to lay it out.
 *
 * The homepage previously had six near-identical horizontal rails stacked on
 * top of each other, so every section looked the same and the page felt
 * endless. Real marketplaces alternate: a scrollable rail for browsing, a
 * compact grid for scanning, and a horizontal list where the seller, brand
 * and rating matter. This component supports all three from one contract,
 * and `switchable` lets the shopper choose — the control that top
 * marketplaces put above their main catalogue band.
 */
export function ProductShowcaseSection({
  title,
  subtitle,
  products,
  viewAllHref,
  locale = 'fa',
  currency = 'AFN',
  layout = 'rail',
  accent,
  icon,
  alt = false,
}: {
  title: string;
  subtitle?: string;
  products: ProductSummary[];
  viewAllHref?: string;
  locale?: Locale;
  currency?: string;
  layout?: ShowcaseLayout;
  accent?: string;
  icon?: ShowcaseIcon;
  alt?: boolean;
}) {
  const t = COPY[locale] ?? COPY.fa;
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [mode, setMode] = React.useState<'grid' | 'list'>('grid');

  if (!products.length) return null;

  const scroll = (direction: 1 | -1) => trackRef.current?.scrollBy({ left: direction * 360, behavior: 'smooth' });
  const effective: 'rail' | 'grid' | 'list' = layout === 'switchable' ? mode : layout;
  const Icon = icon ? ICONS[icon] : null;

  return (
    <section className={cn('section-band', alt && 'section-band-alt')} aria-label={title}>
      <div className="section-shell">
        <div className="section-head">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon ? (
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: accent ?? 'var(--gradient-hot)' }}
              >
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
            ) : (
              <span className="section-accent-bar" style={accent ? { background: accent } : undefined} />
            )}
            <div className="min-w-0">
              <h2 className="section-head-title">{title}</h2>
              {subtitle ? <p className="section-head-sub">{subtitle}</p> : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {layout === 'switchable' ? (
              <div className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5" role="group" aria-label={`${t.grid} / ${t.list}`}>
                <button
                  type="button"
                  onClick={() => setMode('grid')}
                  aria-label={t.grid}
                  aria-pressed={mode === 'grid'}
                  className={cn('flex h-8 w-8 items-center justify-center rounded-full transition-colors', mode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  <Grid2X2 className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  aria-label={t.list}
                  aria-pressed={mode === 'list'}
                  className={cn('flex h-8 w-8 items-center justify-center rounded-full transition-colors', mode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  <Rows3 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}

            {effective === 'rail' ? (
              <>
                <button type="button" onClick={() => scroll(-1)} aria-label={t.prev} className="rail-btn hidden sm:flex">
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => scroll(1)} aria-label={t.next} className="rail-btn hidden sm:flex">
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </button>
              </>
            ) : null}

            {viewAllHref ? (
              <Link href={viewAllHref as never} className="section-head-action">
                {t.all}
                <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>

        {effective === 'rail' ? (
          <div ref={trackRef} className="rail" dir={locale === 'en' ? 'ltr' : 'rtl'}>
            {products.map((product) => (
              <div key={product.id} className="w-[42vw] flex-none snap-start xs:w-[38vw] sm:w-[30vw] md:w-[23vw] lg:w-[19vw] xl:w-[15.5rem]">
                <MarketplaceProductCard product={product} locale={locale} currency={currency} view="rail" />
              </div>
            ))}
          </div>
        ) : effective === 'list' ? (
          // Two horizontal rows on desktop; one on phones. Wide rows give the
          // seller/brand/rating line the space the vertical tile cannot.
          <div className="grid gap-2.5 lg:grid-cols-2">
            {products.map((product) => (
              <MarketplaceProductCard key={product.id} product={product} locale={locale} currency={currency} view="list" />
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <MarketplaceProductCard key={product.id} product={product} locale={locale} currency={currency} view="grid" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
