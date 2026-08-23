'use client';

import * as React from 'react';
import { PackageSearch, LayoutGrid, List } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Grid } from '@/components/layout/grid';
import { Stack } from '@/components/layout/stack';
import { ShopProductCard } from './shop-product-card';
import { ShopToolbar, type ShopCategoryOption } from './shop-toolbar';
import { ShopFilters, type ShopFiltersValue } from './shop-filters';
import type { ProductSummary, Category } from '@/types';

interface ShopPageClientProps { locale: string; currency?: string; initialCategoryKey?: string; }

const DEFAULT_FILTERS: ShopFiltersValue = {
  priceMin: '', priceMax: '', inStockOnly: false, hasDiscountOnly: false, minRating: '', sellerId: '', sort: 'recommended',
};
const PAGE_SIZE = 40;
const DEBOUNCE_MS = 350;

function unwrap<T>(payload: unknown, fallback: T): T {
  const body = payload as { ok?: boolean; data?: T };
  return body?.ok && body.data !== undefined ? body.data : fallback;
}

interface ApiMeta { total?: number; page?: number; pageSize?: number; hasMore?: boolean; }

function toApiSort(sort: ShopFiltersValue['sort']): string {
  switch (sort) {
    case 'price_asc': return 'priceAsc';
    case 'price_desc': return 'priceDesc';
    case 'popular': return 'popular';
    case 'newest': return 'newest';
    case 'recommended': return 'recommended';
    default: return 'recommended';
  }
}

export function ShopPageClient({ locale, currency = 'AFN', initialCategoryKey }: ShopPageClientProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const initialCategory = initialCategoryKey ?? searchParams.get('categoryKey') ?? searchParams.get('category');
  const initialSort = searchParams.get('sort');
  const initialBadge = searchParams.get('badge');

  const [search, setSearch] = React.useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = React.useState(initialQuery);
  const [category, setCategory] = React.useState<string | 'all'>(initialCategory || 'all');
  const [filters, setFilters] = React.useState<ShopFiltersValue>(() => ({
    ...DEFAULT_FILTERS,
    sort: initialSort === 'priceAsc' ? 'price_asc'
      : initialSort === 'priceDesc' ? 'price_desc'
      : initialSort === 'popular' || initialSort === 'bestSelling' ? 'popular'
      : initialSort === 'newest' ? 'newest'
      : 'recommended',
  }));
  const [allProducts, setAllProducts] = React.useState<ProductSummary[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [meta, setMeta] = React.useState<ApiMeta | null>(null);
  const [view, setView] = React.useState<'grid' | 'list'>(() => searchParams.get('view') === 'list' ? 'list' : 'grid');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
    setAllProducts([]);
  }, [debouncedSearch, category, filters, initialBadge, initialCategoryKey]);

  React.useEffect(() => {
    fetch('/api/categories', { cache: 'no-store' })
      .then((res) => res.json())
      .then((body) => setCategories(unwrap(body, [])))
      .catch(() => setCategories([]));
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    const isLoadMore = page > 1;
    if (isLoadMore) setLoadingMore(true); else setLoading(true);

    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    if (category !== 'all') params.set('categoryKey', category);
    if (initialBadge) params.set('badge', initialBadge);
    if (filters.priceMin !== '') params.set('priceMin', String(filters.priceMin));
    if (filters.priceMax !== '') params.set('priceMax', String(filters.priceMax));
    if (filters.inStockOnly) params.set('inStock', 'true');
    if (filters.hasDiscountOnly) params.set('hasDiscount', 'true');
    if (filters.minRating !== '') params.set('minRating', String(filters.minRating));
    params.set('sort', toApiSort(filters.sort));
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));

    fetch(`/api/products?${params.toString()}`, { cache: 'no-store', signal: controller.signal })
      .then((res) => res.json())
      .then((body) => {
        const newProducts = unwrap<ProductSummary[]>(body, []);
        const bodyMeta = (body as { meta?: ApiMeta }).meta ?? null;
        setMeta(bodyMeta);
        if (isLoadMore) {
          setAllProducts((prev) => {
            const seen = new Set(prev.map((product) => product.id));
            const merged = [...prev];
            for (const product of newProducts) if (!seen.has(product.id)) { seen.add(product.id); merged.push(product); }
            return merged;
          });
        } else {
          setAllProducts(Array.from(new Map(newProducts.map((product) => [product.id, product])).values()));
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') { setAllProducts([]); setMeta(null); }
      })
      .finally(() => { setLoading(false); setLoadingMore(false); });

    return () => controller.abort();
  }, [debouncedSearch, category, filters, initialBadge, page, initialCategoryKey]);

  const categoryOptions = React.useMemo<ShopCategoryOption[]>(
    () => [{ key: 'all', label: 'همه محصولات' }, ...categories.map((item) => ({ key: item.key, label: item.name, count: item.productCount }))],
    [categories],
  );

  const clear = React.useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setCategory(initialCategoryKey ?? 'all');
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setAllProducts([]);
  }, [initialCategoryKey]);

  const hasMore = meta?.hasMore ?? false;
  const totalCount = meta?.total ?? allProducts.length;

  const changeView = (next: 'grid' | 'list') => {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set('view', next);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  };

  return (
    <Stack gap="8" className="py-10 sm:py-12">
      <ShopToolbar
        search={search}
        category={category}
        resultCount={totalCount}
        categories={categoryOptions}
        onSearchChange={setSearch}
        onCategoryChange={(val) => { setCategory(val); setPage(1); setAllProducts([]); }}
        onClear={clear}
      />
      <ShopFilters
        value={filters}
        onChange={(newFilters) => { setFilters(newFilters); setPage(1); setAllProducts([]); }}
        onReset={() => { setFilters(DEFAULT_FILTERS); setPage(1); setAllProducts([]); }}
      />

      {allProducts.length > 0 && (
        <div className="flex items-center justify-between gap-2" role="group" aria-label="Product view">
          <p className="text-xs text-muted-foreground">نمایش {allProducts.length.toLocaleString(locale === 'en' ? 'en-US' : 'fa-IR')} از {totalCount.toLocaleString(locale === 'en' ? 'en-US' : 'fa-IR')} محصول</p>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => changeView('grid')} aria-pressed={view === 'grid'} aria-label="Grid view" className={`rounded-lg p-2 ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground'}`}><LayoutGrid className="h-4 w-4" aria-hidden /></button>
            <button type="button" onClick={() => changeView('list')} aria-pressed={view === 'list'} aria-label="List view" className={`rounded-lg p-2 ${view === 'list' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground'}`}><List className="h-4 w-4" aria-hidden /></button>
          </div>
        </div>
      )}

      {loading && page === 1 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="Loading products">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card"><div className="aspect-square animate-pulse bg-muted" /><div className="space-y-2 p-3"><div className="h-3 w-2/3 animate-pulse rounded bg-muted" /><div className="h-4 w-full animate-pulse rounded bg-muted" /><div className="h-4 w-1/2 animate-pulse rounded bg-muted" /></div></div>)}
        </div>
      ) : allProducts.length > 0 ? (
        <>
          {view === 'grid' ? (
            <Grid cols={2} sm={3} lg={4} xl={5} gap="3" className="sm:gap-4">
              <>{allProducts.map((product) => <ShopProductCard key={product.id} product={product} currency={currency} locale={locale} />)}</>
            </Grid>
          ) : (
            <div className="grid gap-3">{allProducts.map((product) => <ShopProductCard key={product.id} product={product} currency={currency} locale={locale} view="list" />)}</div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button type="button" disabled={loadingMore} onClick={() => setPage((p) => p + 1)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60">
                {loadingMore ? 'در حال بارگذاری…' : `نمایش ${PAGE_SIZE.toLocaleString('fa-IR')} محصول دیگر`}
              </button>
            </div>
          )}
          {!hasMore && meta && <p className="pt-2 text-center text-xs text-muted-foreground">همه {totalCount.toLocaleString(locale === 'en' ? 'en-US' : 'fa-IR')} محصول نمایش داده شد</p>}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center sm:py-20">
          <PackageSearch className="h-10 w-10 text-muted-foreground/60" aria-hidden />
          <div><h3 className="font-display text-lg font-semibold text-foreground">محصولی یافت نشد</h3><p className="mt-1 text-sm text-muted-foreground">کلمه دیگری امتحان کنید یا بخشی از فیلترها را بردارید.</p></div>
          <button type="button" onClick={clear} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">پاک کردن فیلترها</button>
        </div>
      )}
    </Stack>
  );
}
