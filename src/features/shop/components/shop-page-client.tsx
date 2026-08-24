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

const COPY = {
  fa: { allProducts: 'همه محصولات', shown: 'نمایش', of: 'از', products: 'محصول', loading: 'در حال بارگذاری…', more: 'محصول دیگر', allShown: 'همه محصولات نمایش داده شد', notFound: 'محصولی یافت نشد', tryAgain: 'کلمه دیگری امتحان کنید یا بخشی از فیلترها را بردارید.', clear: 'پاک کردن فیلترها', grid: 'نمای شبکه‌ای', list: 'نمای فهرستی' },
  ps: { allProducts: 'ټول محصولات', shown: 'ښودل شوي', of: 'له', products: 'محصولات', loading: 'بارېږي…', more: 'نور محصولات', allShown: 'ټول محصولات وښودل شول', notFound: 'هیڅ محصول ونه موندل شو', tryAgain: 'بله کلمه وازمویئ یا ځینې فلټرونه لرې کړئ.', clear: 'فلټرونه پاک کړئ', grid: 'شبکې بڼه', list: 'لست بڼه' },
  en: { allProducts: 'All products', shown: 'Showing', of: 'of', products: 'products', loading: 'Loading…', more: 'more products', allShown: 'All products are displayed', notFound: 'No products found', tryAgain: 'Try another keyword or remove some filters.', clear: 'Clear filters', grid: 'Grid view', list: 'List view' },
} as const;

type Locale = keyof typeof COPY;
function copyFor(locale: string): (typeof COPY)[Locale] { return COPY[locale === 'en' || locale === 'ps' ? locale : 'fa']; }
function unwrap<T>(payload: unknown, fallback: T): T { const body = payload as { ok?: boolean; data?: T }; return body?.ok && body.data !== undefined ? body.data : fallback; }
function toApiSort(sort: ShopFiltersValue['sort']): string { return ({ price_asc: 'priceAsc', price_desc: 'priceDesc', popular: 'popular', newest: 'newest', rating: 'rating', recommended: 'recommended' } as const)[sort] ?? 'recommended'; }
function fromApiSort(value: string | null): ShopFiltersValue['sort'] { return value === 'priceAsc' ? 'price_asc' : value === 'priceDesc' ? 'price_desc' : value === 'popular' || value === 'bestSelling' ? 'popular' : value === 'newest' ? 'newest' : value === 'rating' ? 'rating' : 'recommended'; }
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
  const skipUrlSyncRef = React.useRef(false);
  const copy = copyFor(locale);

  React.useEffect(() => {
    const state = stateFromUrl(new URL(window.location.href), initialCategoryKey);
    skipUrlSyncRef.current = true;
    setSearch(state.search); setDebouncedSearch(state.search); setCategory(state.category); setFilters(state.filters); setView(state.view); setPage(1); setAllProducts([]); hydratedRef.current = true;
  }, [searchParams, initialCategoryKey]);

  React.useEffect(() => {
    const onPopState = () => {
      const state = stateFromUrl(new URL(window.location.href), initialCategoryKey);
      skipUrlSyncRef.current = true;
      setSearch(state.search); setDebouncedSearch(state.search); setCategory(state.category); setFilters(state.filters); setView(state.view); setPage(1); setAllProducts([]);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [initialCategoryKey]);

  React.useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS); return () => window.clearTimeout(timer); }, [search]);

  React.useEffect(() => {
    if (!hydratedRef.current) return;
    if (skipUrlSyncRef.current) { skipUrlSyncRef.current = false; return; }
    const url = new URL(window.location.href); const p = url.searchParams;
    const setOrDelete = (key: string, value: string | null) => { if (value) p.set(key, value); else p.delete(key); };
    setOrDelete('q', debouncedSearch.trim() || null); setOrDelete('categoryKey', category !== 'all' ? category : null); setOrDelete('subcategoryKey', filters.subcategoryKey || null); setOrDelete('sellerId', filters.sellerId || null); setOrDelete('badge', filters.badge || null); setOrDelete('priceMin', filters.priceMin === '' ? null : String(filters.priceMin)); setOrDelete('priceMax', filters.priceMax === '' ? null : String(filters.priceMax)); setOrDelete('inStock', filters.inStockOnly ? 'true' : null); setOrDelete('hasDiscount', filters.hasDiscountOnly ? 'true' : null); setOrDelete('minRating', filters.minRating === '' ? null : String(filters.minRating)); setOrDelete('sort', filters.sort !== 'recommended' ? toApiSort(filters.sort) : null); if (view === 'list') p.set('view', 'list'); else p.delete('view');
    window.history.pushState(window.history.state, '', `${url.pathname}${p.toString() ? `?${p.toString()}` : ''}${url.hash}`);
  }, [debouncedSearch, category, filters, view]);

  React.useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const [categoryResult, sellerResult] = await Promise.all([
          fetch(`/api/categories?locale=${encodeURIComponent(locale)}`, { cache: 'no-store', signal: controller.signal }).then(async (res) => unwrap<Category[]>(await res.json(), [])),
          fetch('/api/sellers?page=1&pageSize=48', { cache: 'no-store', signal: controller.signal }).then(async (res) => { const body = await res.json(); return { items: unwrap<SellerOption[]>(body, []), meta: (body as { meta?: ApiMeta }).meta }; }),
        ]);
        setCategories(categoryResult);
        const firstSellers = sellerResult.items;
        if (!sellerResult.meta?.hasMore) { setSellers(firstSellers); return; }
        const pageCount = Math.min(6, Math.ceil((sellerResult.meta.total ?? firstSellers.length) / 48));
        const rest = await Promise.all(Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => fetch(`/api/sellers?page=${index + 2}&pageSize=48`, { cache: 'no-store', signal: controller.signal }).then(async (res) => unwrap<SellerOption[]>(await res.json(), []))));
        const unique = new Map<string, SellerOption>();
        [...firstSellers, ...rest.flat()].forEach((seller) => unique.set(seller.id, seller));
        setSellers([...unique.values()]);
      } catch (error) {
        if ((error as Error)?.name !== 'AbortError') { setCategories([]); setSellers([]); }
      }
    };
    void load();
    return () => controller.abort();
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

  const categoryOptions = React.useMemo<ShopCategoryOption[]>(() => [{ key: 'all', label: copy.allProducts }, ...categories.map((item) => ({ key: item.key, label: item.name, count: item.productCount }))], [categories, copy.allProducts]);
  const subcategories = React.useMemo<ShopOption[]>(() => { if (category === 'all') return []; const parent = categories.find((item) => item.key === category); return categories.filter((item) => parent?.id && item.parentId === parent.id).map((item) => ({ key: item.key, label: item.name, count: item.productCount })); }, [categories, category]);
  const sellerOptions = React.useMemo<ShopOption[]>(() => sellers.map((seller) => ({ key: seller.id, label: seller.shopName })), [sellers]);
  const hasMore = meta?.hasMore ?? false; const totalCount = meta?.total ?? allProducts.length;
  const clear = React.useCallback(() => { setSearch(''); setDebouncedSearch(''); setCategory(initialCategoryKey ?? 'all'); setFilters(DEFAULT_FILTERS); setPage(1); setAllProducts([]); }, [initialCategoryKey]);
  const changeCategory = (val: string) => { setCategory(val); setFilters((current) => ({ ...current, subcategoryKey: '' })); setPage(1); setAllProducts([]); };

  return <Stack gap="8" className="py-10 sm:py-12">
    <ShopToolbar search={search} category={category} resultCount={totalCount} categories={categoryOptions} onSearchChange={setSearch} onCategoryChange={changeCategory} onClear={clear} />
    <ShopFilters value={filters} onChange={(newFilters) => { setFilters(newFilters); setPage(1); setAllProducts([]); }} onReset={() => { setFilters(DEFAULT_FILTERS); setPage(1); setAllProducts([]); }} subcategories={subcategories} sellers={sellerOptions} locale={locale} />
    {allProducts.length > 0 && <div className="flex items-center justify-between gap-2" role="group" aria-label={locale === 'en' ? 'Product view' : locale === 'ps' ? 'د محصولاتو بڼه' : 'نمایش محصولات'}><p className="text-xs text-muted-foreground">{copy.shown} {allProducts.length.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR')} {copy.of} {totalCount.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR')} {copy.products}</p><div className="flex items-center gap-1"><button type="button" onClick={() => setView('grid')} aria-pressed={view === 'grid'} aria-label={copy.grid} className={`rounded-lg p-2 ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground'}`}><LayoutGrid className="h-4 w-4" aria-hidden /></button><button type="button" onClick={() => setView('list')} aria-pressed={view === 'list'} aria-label={copy.list} className={`rounded-lg p-2 ${view === 'list' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground'}`}><List className="h-4 w-4" aria-hidden /></button></div></div>}
    {loading && page === 1 ? <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5" aria-label={copy.loading}>{Array.from({ length: 9 }).map((_, i) => <div key={i} className="overflow-hidden rounded-xl border border-border bg-card"><div className="aspect-square animate-pulse bg-muted" /><div className="space-y-2 p-2.5"><div className="h-3 w-2/3 animate-pulse rounded bg-muted" /><div className="h-4 w-full animate-pulse rounded bg-muted" /><div className="h-4 w-1/2 animate-pulse rounded bg-muted" /></div></div>)}</div> : allProducts.length > 0 ? <>
      {view === 'grid' ? <Grid cols={3} sm={3} lg={4} xl={5} gap="2" className="sm:gap-3"><>{allProducts.map((product) => <ShopProductCard key={product.id} product={product} currency={currency} locale={locale} />)}</></Grid> : <div className="grid gap-3">{allProducts.map((product) => <ShopProductCard key={product.id} product={product} currency={currency} locale={locale} view="list" />)}</div>}
      {hasMore && <div className="flex justify-center pt-2"><button type="button" disabled={loadingMore} onClick={() => setPage((p) => p + 1)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60">{loadingMore ? copy.loading : `${PAGE_SIZE.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR')} ${copy.more}`}</button></div>}
      {!hasMore && meta && <p className="pt-2 text-center text-xs text-muted-foreground">{copy.allShown}: {totalCount.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR')}</p>}
    </> : <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center sm:py-20"><PackageSearch className="h-10 w-10 text-muted-foreground/60" aria-hidden /><div><h3 className="font-display text-lg font-semibold text-foreground">{copy.notFound}</h3><p className="mt-1 text-sm text-muted-foreground">{copy.tryAgain}</p></div><button type="button" onClick={clear} className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">{copy.clear}</button></div>}
  </Stack>;
}
