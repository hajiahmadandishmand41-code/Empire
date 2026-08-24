'use client';

import * as React from 'react';
import { PackageSearch, LayoutGrid, List } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Grid } from '@/components/layout/grid';
import { Stack } from '@/components/layout/stack';
import { ShopProductCard } from './shop-product-card';
import { ShopToolbar, type ShopCategoryOption } from './shop-toolbar';
import { ShopFilters, type ShopFiltersValue, type ShopOption } from './shop-filters';
import type { ProductSummary, Category } from '@/types';

interface ShopPageClientProps { locale: string; currency?: string; initialCategoryKey?: string; }
const PAGE_SIZE = 40;
const DEBOUNCE_MS = 350;
const DEFAULT_FILTERS: ShopFiltersValue = { subcategoryKey: '', sellerId: '', badge: '', priceMin: '', priceMax: '', inStockOnly: false, hasDiscountOnly: false, minRating: '', sort: 'recommended' };
interface ApiMeta { total?: number; page?: number; pageSize?: number; hasMore?: boolean; }
interface SellerOption { id: string; shopName: string; }
function unwrap<T>(payload: unknown, fallback: T): T { const body = payload as { ok?: boolean; data?: T }; return body?.ok && body.data !== undefined ? body.data : fallback; }
function toApiSort(sort: ShopFiltersValue['sort']): string { return ({ price_asc: 'priceAsc', price_desc: 'priceDesc', popular: 'popular', newest: 'newest', recommended: 'recommended' } as const)[sort] ?? 'recommended'; }
function fromApiSort(value: string | null): ShopFiltersValue['sort'] { return value === 'priceAsc' ? 'price_asc' : value === 'priceDesc' ? 'price_desc' : value === 'popular' || value === 'bestSelling' ? 'popular' : value === 'newest' ? 'newest' : 'recommended'; }
function numberOrEmpty(value: string | null): number | '' { if (!value) return ''; const n = Number(value); return Number.isFinite(n) && n >= 0 ? n : ''; }
function stateFromUrl(url: URL, initialCategoryKey?: string) {
  const p = url.searchParams;
  const filters: ShopFiltersValue = { ...DEFAULT_FILTERS, subcategoryKey: p.get('subcategoryKey') ?? p.get('subcategory') ?? '', sellerId: p.get('sellerId') ?? p.get('seller') ?? '', badge: p.get('badge') ?? '', priceMin: numberOrEmpty(p.get('priceMin')), priceMax: numberOrEmpty(p.get('priceMax')), inStockOnly: p.get('inStock') === 'true', hasDiscountOnly: p.get('hasDiscount') === 'true', minRating: numberOrEmpty(p.get('minRating')), sort: fromApiSort(p.get('sort')) };
  return { search: p.get('q') ?? '', category: p.get('categoryKey') ?? p.get('category') ?? initialCategoryKey ?? 'all', filters, view: p.get('view') === 'list' ? 'list' as const : 'grid' as const };
}

export function ShopPageClient({ locale, currency = 'AFN', initialCategoryKey }: ShopPageClientProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [category, setCategory] = React.useState<string | 'all'>('all');
  const [filters, setFilters] = React.useState<ShopFiltersValue>(DEFAULT_FILTERS);
  const [allProducts, setAllProducts] = React.useState<ProductSummary[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [sellers, setSellers] = React.useState<SellerOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [meta, setMeta] = React.useState<ApiMeta | null>(null);
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const hydratedRef = React.useRef(false);

  React.useEffect(() => {
    const state = stateFromUrl(new URL(window.location.href), initialCategoryKey);
    setSearch(state.search); setDebouncedSearch(state.search); setCategory(state.category); setFilters(state.filters); setView(state.view); hydratedRef.current = true;
  }, [searchParams, initialCategoryKey]);

  React.useEffect(() => {
    const onPopState = () => {
      const state = stateFromUrl(new URL(window.location.href), initialCategoryKey);
      setSearch(state.search); setDebouncedSearch(state.search); setCategory(state.category); setFilters(state.filters); setView(state.view); setPage(1); setAllProducts([]);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [initialCategoryKey]);

  React.useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS); return () => window.clearTimeout(timer); }, [search]);

  React.useEffect(() => {
    if (!hydratedRef.current) return;
    const url = new URL(window.location.href); const p = url.searchParams;
    const setOrDelete = (key: string, value: string | null) => { if (value) p.set(key, value); else p.delete(key); };
    setOrDelete('q', debouncedSearch.trim() || null); setOrDelete('categoryKey', category !== 'all' ? category : null); setOrDelete('subcategoryKey', filters.subcategoryKey || null); setOrDelete('sellerId', filters.sellerId || null); setOrDelete('badge', filters.badge || null); setOrDelete('priceMin', filters.priceMin === '' ? null : String(filters.priceMin)); setOrDelete('priceMax', filters.priceMax === '' ? null : String(filters.priceMax)); setOrDelete('inStock', filters.inStockOnly ? 'true' : null); setOrDelete('hasDiscount', filters.hasDiscountOnly ? 'true' : null); setOrDelete('minRating', filters.minRating === '' ? null : String(filters.minRating)); setOrDelete('sort', filters.sort !== 'recommended' ? toApiSort(filters.sort) : null); if (view === 'list') p.set('view', 'list'); else p.delete('view');
    window.history.replaceState(window.history.state, '', `${url.pathname}${p.toString() ? `?${p.toString()}` : ''}${url.hash}`);
  }, [debouncedSearch, category, filters, view]);

  React.useEffect(() => {
    fetch(`/api/categories?locale=${encodeURIComponent(locale)}`, { cache: 'no-store' }).then((res) => res.json()).then((body) => setCategories(unwrap(body, []))).catch(() => setCategories([]));
    fetch('/api/sellers?page=1&pageSize=48', { cache: 'no-store' }).then((res) => res.json()).then((body) => setSellers(unwrap<SellerOption[]>(body, []))).catch(() => setSellers([]));
  }, [locale]);

  React.useEffect(() => { setPage(1); setAllProducts([]); }, [debouncedSearch, category, filters]);

  React.useEffect(() => {
    const controller = new AbortController(); const isLoadMore = page > 1; if (isLoadMore) setLoadingMore(true); else setLoading(true);
    const params = new URLSearchParams(); if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim()); if (category !== 'all') params.set('categoryKey', category); if (filters.subcategoryKey) params.set('subcategoryKey', filters.subcategoryKey); if (filters.sellerId) params.set('sellerId', filters.sellerId); if (filters.badge) params.set('badge', filters.badge); if (filters.priceMin !== '') params.set('priceMin', String(filters.priceMin)); if (filters.priceMax !== '') params.set('priceMax', String(filters.priceMax)); if (filters.inStockOnly) params.set('inStock', 'true'); if (filters.hasDiscountOnly) params.set('hasDiscount', 'true'); if (filters.minRating !== '') params.set('minRating', String(filters.minRating)); params.set('sort', toApiSort(filters.sort)); params.set('page', String(page)); params.set('pageSize', String(PAGE_SIZE)); params.set('locale', locale);
    fetch(`/api/products?${params.toString()}`, { cache: 'no-store', signal: controller.signal }).then((res) => res.json()).then((body) => {
      const newProducts = unwrap<ProductSummary[]>(body, []); setMeta((body as { meta?: ApiMeta }).meta ?? null);
      if (isLoadMore) setAllProducts((prev) => { const seen = new Set(prev.map((product) => product.id)); const merged = [...prev]; for (const product of newProducts) if (!seen.has(product.id)) { seen.add(product.id); merged.push(product); } return merged; });
      else setAllProducts(Array.from(new Map(newProducts.map((product) => [product.id, product])).values()));
    }).catch((error) => { if (error?.name !== 'AbortError') { setAllProducts([]); setMeta(null); } }).finally(() => { setLoading(false); setLoadingMore(false); });
    return () => controller.abort();
  }, [debouncedSearch, category, filters, page, locale]);

  const categoryOptions = React.useMemo<ShopCategoryOption[]>(() => [{ key: 'all', label: locale === 'en' ? 'All products' : locale === 'ps' ? 'ټول محصولات' : 'همه محصولات' }, ...categories.map((item) => ({ key: item.key, label: item.name, count: item.productCount }))], [categories, locale]);
  const subcategories = React.useMemo<ShopOption[]>(() => { if (category === 'all') return []; const parent = categories.find((item) => item.key === category); return categories.filter((item) => parent?.id && item.parentId === parent.id).map((item) => ({ key: item.key, label: item.name, count: item.productCount })); }, [categories, category]);
  const sellerOptions = React.useMemo<ShopOption[]>(() => sellers.map((seller) => ({ key: seller.id, label: seller.shopName })), [sellers]);
  const hasMore = meta?.hasMore ?? false; const totalCount = meta?.total ?? allProducts.length;
  const clear = React.useCallback(() => { setSearch(''); setDebouncedSearch(''); setCategory(initialCategoryKey ?? 'all'); setFilters(DEFAULT_FILTERS); setPage(1); setAllProducts([]); }, [initialCategoryKey]);
  const changeCategory = (val: string) => { setCategory(val); setFilters((current) => ({ ...current, subcategoryKey: '' })); setPage(1); setAllProducts([]); };

  return <Stack gap="8" className="py-10 sm:py-12">
    <ShopToolbar search={search} category={category} resultCount={totalCount} categories={categoryOptions} onSearchChange={setSearch} onCategoryChange={changeCategory} onClear={clear} />
    <ShopFilters value={filters} onChange={(newFilters) => { setFilters(newFilters); setPage(1); setAllProducts([]); }} onReset={() => { setFilters(DEFAULT_FILTERS); setPage(1); setAllProducts([]); }} subcategories={subcategories} sellers={sellerOptions} />
    {allProducts.length > 0 && <div className="flex items-center justify-between gap-2" role="group" aria-label="Product view"><p className="text-xs text-muted-foreground">نمایش {allProducts.length.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR')} از {totalCount.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR')} محصول</p><div className="flex items-center gap-1"><button type="button" onClick={() => setView('grid')} aria-pressed={view === 'grid'} aria-label="Grid view" className={`rounded-lg p-2 ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground'}`}><LayoutGrid className="h-4 w-4" aria-hidden /></button><button type="button" onClick={() => setView('list')} aria-pressed={view === 'list'} aria-label="List view" className={`rounded-lg p-2 ${view === 'list' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground'}`}><List className="h-4 w-4" aria-hidden /></button></div></div>}
    {loading && page === 1 ? <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="Loading products">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="overflow-hidden rounded-xl border border-border bg-card"><div className="aspect-square animate-pulse bg-muted" /><div className="space-y-2 p-2.5"><div className="h-3 w-2/3 animate-pulse rounded bg-muted" /><div className="h-4 w-full animate-pulse rounded bg-muted" /><div className="h-4 w-1/2 animate-pulse rounded bg-muted" /></div></div>)}</div> : allProducts.length > 0 ? <>
      {view === 'grid' ? <Grid cols={3} sm={3} lg={4} xl={5} gap="2" className="sm:gap-3"><>{allProducts.map((product) => <ShopProductCard key={product.id} product={product} currency={currency} locale={locale} />)}</></Grid> : <div className="grid gap-3">{allProducts.map((product) => <ShopProductCard key={product.id} product={product} currency={currency} locale={locale} view="list" />)}</div>}
      {hasMore && <div className="flex justify-center pt-2"><button type="button" disabled={loadingMore} onClick={() => setPage((p) => p + 1)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60">{loadingMore ? 'در حال بارگذاری…' : `نمایش ${PAGE_SIZE.toLocaleString('fa-IR')} محصول دیگر`}</button></div>}
      {!hasMore && meta && <p className="pt-2 text-center text-xs text-muted-foreground">همه {totalCount.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR')} محصول نمایش داده شد</p>}
    </> : <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center sm:py-20"><PackageSearch className="h-10 w-10 text-muted-foreground/60" aria-hidden /><div><h3 className="font-display text-lg font-semibold text-foreground">محصولی یافت نشد</h3><p className="mt-1 text-sm text-muted-foreground">کلمه دیگری امتحان کنید یا بخشی از فیلترها را بردارید.</p></div><button type="button" onClick={clear} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">پاک کردن فیلترها</button></div>}
  </Stack>;
}
