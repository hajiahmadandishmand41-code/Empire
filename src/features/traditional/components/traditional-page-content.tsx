'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ChevronDown, Loader2, Package, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { MarketplaceProductCard } from '@/components/marketplace-product-card';
import type { ProductSummary } from '@/types';

const CATEGORY_KEYS = ['all', 'carpet', 'saffron', 'driedFruits', 'handicrafts', 'localClothing', 'honey', 'nuts', 'gemstones', 'traditional'] as const;
const CATEGORY_EMOJI: Record<(typeof CATEGORY_KEYS)[number], string> = { all: '🇦🇫', carpet: '🎨', saffron: '🌸', driedFruits: '🍇', handicrafts: '🏺', localClothing: '👘', honey: '🍯', nuts: '🥜', gemstones: '💎', traditional: '✨' };
interface Product { id: string; name: string; slug: string; price: number; comparePrice?: number | null; images?: Array<{ url?: string; src?: string }>; rating?: number; category?: { name: string }; categoryKey?: ProductSummary['categoryKey']; }
const PAGE_SIZE = 12;
type SortKey = 'recommended' | 'newest' | 'bestSelling' | 'priceAsc' | 'priceDesc';

async function fetchProducts(categoryKey: string, page: number, search: string, sort: SortKey, minPrice: string, maxPrice: string): Promise<Product[]> {
  try {
    const params = new URLSearchParams({ page: String(page + 1), pageSize: String(PAGE_SIZE), isTraditional: 'true', sort });
    if (categoryKey !== 'all') params.set('categoryKey', categoryKey);
    if (search.trim()) params.set('q', search.trim());
    if (minPrice) params.set('priceMin', minPrice);
    if (maxPrice) params.set('priceMax', maxPrice);
    const response = await fetch(`/api/products?${params.toString()}`, { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return data?.ok && Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

function toSummary(product: Product): ProductSummary {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: '',
    categoryKey: product.categoryKey ?? 'digital',
    price: product.price,
    currency: 'AFN',
    comparePrice: product.comparePrice,
    region: 'افغانستان',
    images: (product.images ?? []).map((image) => ({ src: image.url ?? image.src ?? null, alt: product.name })),
    averageRating: product.rating,
    reviewCount: undefined,
    isTraditional: true,
    inStock: true,
  };
}

function ProductSkeleton() {
  return <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="aspect-[4/3] animate-pulse bg-muted" /><div className="space-y-2 p-3"><div className="h-2.5 w-16 animate-pulse rounded bg-muted" /><div className="h-3 w-full animate-pulse rounded bg-muted" /><div className="h-3 w-3/4 animate-pulse rounded bg-muted" /></div></div>;
}

export function TraditionalPageContent({ locale = 'fa' }: { locale?: string }) {
  const t = useTranslations('traditional');
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORY_KEYS)[number]>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recommended');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadProducts = useCallback(async (categoryKey: string, pageIndex: number, reset = false) => {
    setLoading(true);
    try {
      const newProducts = await fetchProducts(categoryKey, pageIndex, appliedSearch, sort, minPrice, maxPrice);
      setProducts((previous) => reset ? newProducts : [...previous, ...newProducts]);
      setHasMore(newProducts.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, sort, minPrice, maxPrice]);

  useEffect(() => {
    setPage(0);
    setProducts([]);
    setHasMore(true);
    void loadProducts(activeCategory, 0, true);
  }, [activeCategory, appliedSearch, sort, minPrice, maxPrice, loadProducts]);

  useEffect(() => {
    const element = loaderRef.current;
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loading && hasMore && products.length > 0) {
        const nextPage = page + 1;
        setPage(nextPage);
        void loadProducts(activeCategory, nextPage);
      }
    }, { rootMargin: '300px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [loading, hasMore, products.length, page, activeCategory, loadProducts]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setAppliedSearch(search);
  };

  return <div className="min-h-dvh">
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-800 py-12 sm:py-16">
      <div className="pointer-events-none absolute -start-20 -top-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -end-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 lg:grid-cols-[1fr_auto]">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-emerald-100 ring-1 ring-white/20 backdrop-blur">{t('badge')}</div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">{t('title')}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-100/85 sm:text-base">{t('subtitle')}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-white/90"><span className="rounded-full bg-white/10 px-3 py-1.5">{t('heroPill1')}</span><span className="rounded-full bg-white/10 px-3 py-1.5">{t('heroPill2')}</span><span className="rounded-full bg-white/10 px-3 py-1.5">{t('heroPill3')}</span></div>
        </div>
        <div className="hidden h-40 w-40 items-center justify-center rounded-full border border-white/15 bg-white/5 text-7xl shadow-2xl backdrop-blur sm:flex" aria-hidden="true">🇦🇫</div>
      </div>
    </section>

    <div className="sticky top-0 z-20 border-b border-border bg-background/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4"><div className="no-scrollbar flex gap-2 overflow-x-auto py-3" role="tablist" aria-label={t('title')}>
        {CATEGORY_KEYS.map((key) => <button key={key} type="button" role="tab" aria-selected={activeCategory === key} onClick={() => setActiveCategory(key)} className={cn('inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all', activeCategory === key ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground')}><span aria-hidden="true">{CATEGORY_EMOJI[key]}</span>{t(`categories.${key}`)}</button>)}
      </div></div>
    </div>

    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={submitSearch} className="flex flex-1 gap-2"><div className="relative flex-1"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('searchPlaceholder')} className="h-11 w-full rounded-xl border border-border bg-background ps-10 pe-3 text-sm outline-none ring-primary/20 transition focus:ring-2" /></div><button type="submit" className="h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground">{t('search')}</button></form>
          <button type="button" onClick={() => setFiltersOpen((value) => !value)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />{t('filters')}<ChevronDown className={cn('h-4 w-4 transition-transform', filtersOpen && 'rotate-180')} /></button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2"><label className="text-xs font-semibold text-muted-foreground">{t('sort')}</label><select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none"><option value="recommended">{t('sortRecommended')}</option><option value="newest">{t('sortNewest')}</option><option value="bestSelling">{t('sortBestSelling')}</option><option value="priceAsc">{t('sortPriceAsc')}</option><option value="priceDesc">{t('sortPriceDesc')}</option></select></div>
        {filtersOpen && <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2"><label className="text-xs font-semibold text-muted-foreground">{t('minPrice')}<input inputMode="numeric" value={minPrice} onChange={(event) => setMinPrice(event.target.value.replace(/\D/g, ''))} placeholder="0" className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-primary/20" /></label><label className="text-xs font-semibold text-muted-foreground">{t('maxPrice')}<input inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value.replace(/\D/g, ''))} placeholder="1000000" className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-primary/20" /></label></div>}
      </div>

      <div className="mb-5 flex items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /><h2 className="text-lg font-extrabold">{t('collectionTitle')}</h2></div><p className="mt-1 text-xs text-muted-foreground">{appliedSearch ? `${t('resultsFor')} “${appliedSearch}”` : t('collectionSubtitle')}</p></div>{products.length > 0 && <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{products.length}+ </span>}</div>

      {!loading && products.length === 0 && <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center"><div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60" aria-hidden="true"><Package className="h-10 w-10 text-muted-foreground/40" /></div><p className="text-sm font-bold text-foreground">{t('emptyTitle')}</p><p className="max-w-sm text-xs leading-5 text-muted-foreground">{t('emptyDescription')}</p><button type="button" onClick={() => { setActiveCategory('all'); setSearch(''); setAppliedSearch(''); setMinPrice(''); setMaxPrice(''); setSort('recommended'); }} className="mt-2 inline-flex min-h-10 items-center rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">{t('showAll')}</button></div>}

      {products.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">{products.map((product) => <MarketplaceProductCard key={product.id} product={toSummary(product)} locale={locale} currency="AFN" view="grid" />)}</div>}
      {loading && products.length === 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5" aria-busy="true">{Array.from({ length: 10 }).map((_, index) => <ProductSkeleton key={index} />)}</div>}
      <div ref={loaderRef} className="flex justify-center py-8" aria-live="polite">{loading && products.length > 0 && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="text-sm">{t('loading')}</span></div>}{!loading && !hasMore && products.length > 0 && <p className="py-2 text-center text-xs text-muted-foreground">{t('endOfList')}</p>}</div>
    </div>
  </div>;
}
