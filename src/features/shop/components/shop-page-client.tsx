'use client';

import * as React from 'react';
import { PackageSearch } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Grid } from '@/components/layout/grid';
import { Stack } from '@/components/layout/stack';
import { ShopProductCard } from './shop-product-card';
import { ShopToolbar, type ShopCategoryOption } from './shop-toolbar';
import { ShopFilters, type ShopFiltersValue } from './shop-filters';
import type { ProductSummary, Category } from '@/types';

interface ShopPageClientProps { locale: string; currency?: string; }
const DEFAULT_FILTERS: ShopFiltersValue = { priceMin: '', priceMax: '', inStockOnly: false, sellerId: '', sort: 'recommended' };
const PAGE_SIZE = 24;
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
    case 'recommended': return 'recommended';
    default: return 'recommended';
  }
}

const CATEGORY_LABELS: Record<string, { fa: string; ps: string; en: string }> = {
  clothing: { fa: 'پوشاک', ps: 'جامې', en: 'Clothing' },
  digital: { fa: 'موبایل و دیجیتال', ps: 'موبایل او ډیجیټل', en: 'Mobile & Digital' },
  homeAppliances: { fa: 'خانه و آشپزخانه', ps: 'کور او پخلنځی', en: 'Home & Kitchen' },
  beauty: { fa: 'بهداشت و زیبایی', ps: 'روغتیا او ښکلا', en: 'Beauty & Care' },
  sports: { fa: 'ورزش', ps: 'ورزش', en: 'Sports' },
  footwear: { fa: 'کفش و کیف', ps: 'بوټان او بکسونه', en: 'Footwear & Bags' },
  baby: { fa: 'کودک و نوزاد', ps: 'ماشومان', en: 'Baby & Kids' },
  books: { fa: 'کتاب و آموزش', ps: 'کتابونه او زده کړه', en: 'Books & Learning' },
  electronics: { fa: 'لوازم الکترونیکی', ps: 'برېښنایي وسایل', en: 'Electronics' },
  watches: { fa: 'ساعت و اکسسوری', ps: 'ساعتونه او لوازم', en: 'Watches & Accessories' },
};

function categoryLabel(key: string, fallback: string, locale: string) {
  const labels = CATEGORY_LABELS[key];
  if (!labels) return fallback;
  return locale === 'en' ? labels.en : locale === 'ps' ? labels.ps : labels.fa;
}

export function ShopPageClient({ locale, currency = 'AFN' }: ShopPageClientProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const initialCategory = searchParams.get('categoryKey') ?? searchParams.get('category');
  const initialSort = searchParams.get('sort');
  const initialBadge = searchParams.get('badge');

  const [search, setSearch] = React.useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = React.useState(initialQuery);
  const [category, setCategory] = React.useState<string | 'all'>(initialCategory || 'all');
  const [filters, setFilters] = React.useState<ShopFiltersValue>(() => ({
    ...DEFAULT_FILTERS,
    sort: initialSort === 'priceAsc' ? 'price_asc' : initialSort === 'priceDesc' ? 'price_desc' : initialSort === 'popular' || initialSort === 'bestSelling' ? 'popular' : 'recommended',
  }));
  const [allProducts, setAllProducts] = React.useState<ProductSummary[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [meta, setMeta] = React.useState<ApiMeta | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
    setAllProducts([]);
  }, [debouncedSearch, category, filters, initialBadge]);

  React.useEffect(() => {
    fetch('/api/categories', { cache: 'no-store' })
      .then((res) => res.json())
      .then((body) => setCategories(unwrap<Category[]>(body, [])))
      .catch(() => setCategories([]));
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    const isLoadMore = page > 1;
    if (isLoadMore) setLoadingMore(true); else setLoading(true);

    const params = new URLSearchParams();
    const q = debouncedSearch.trim();
    if (q) params.set('q', q);
    if (category !== 'all') params.set('categoryKey', category);
    if (initialBadge) params.set('badge', initialBadge);
    if (filters.priceMin !== '') params.set('priceMin', String(filters.priceMin));
    if (filters.priceMax !== '') params.set('priceMax', String(filters.priceMax));
    if (filters.inStockOnly) params.set('inStock', 'true');
    params.set('sort', toApiSort(filters.sort));
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));

    fetch(`/api/products?${params.toString()}`, { cache: 'no-store', signal: controller.signal })
      .then(async (res) => ({ ok: res.ok, body: await res.json() as unknown }))
      .then(({ ok, body }) => {
        if (!ok) throw new Error('products_failed');
        const newProducts = unwrap<ProductSummary[]>(body, []);
        const bodyMeta = (body as { meta?: ApiMeta }).meta ?? null;
        setMeta(bodyMeta);
        if (isLoadMore) setAllProducts((prev) => [...prev, ...newProducts]);
        else setAllProducts(newProducts);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          if (!isLoadMore) setAllProducts([]);
        }
      })
      .finally(() => { setLoading(false); setLoadingMore(false); });

    return () => controller.abort();
  }, [debouncedSearch, category, filters, initialBadge, page]);

  const categoryOptions = React.useMemo<ShopCategoryOption[]>(() => [
    { key: 'all', label: locale === 'en' ? 'All products' : locale === 'ps' ? 'ټول محصولات' : 'همه محصولات' },
    ...categories.map((item) => ({ key: item.key, label: categoryLabel(item.key, item.name, locale), count: item.productCount })),
  ], [categories, locale]);

  const clear = React.useCallback(() => {
    setSearch(''); setDebouncedSearch(''); setCategory('all'); setFilters(DEFAULT_FILTERS); setPage(1); setAllProducts([]);
  }, []);
  const hasMore = meta?.hasMore ?? false;
  const totalCount = meta?.total ?? allProducts.length;

  return (
    <Stack gap="8" className="py-6 sm:py-10">
      <section aria-label={locale === 'en' ? 'Categories' : locale === 'ps' ? 'کټګورۍ' : 'دسته‌بندی‌ها'} className="-mx-1 overflow-hidden">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory">
          {categoryOptions.slice(0, 11).map((item) => (
            <button key={item.key} type="button" onClick={() => { setCategory(item.key); setPage(1); setAllProducts([]); }} className={`shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-bold transition-all ${category === item.key ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-card text-foreground hover:border-primary/40 hover:text-primary'}`}>
              {item.label}{typeof item.count === 'number' ? <span className="ms-1 opacity-60">{item.count}</span> : null}
            </button>
          ))}
        </div>
      </section>

      <ShopToolbar search={search} category={category} resultCount={totalCount} categories={categoryOptions} onSearchChange={setSearch} onCategoryChange={(val) => { setCategory(val); setPage(1); setAllProducts([]); }} onClear={clear} />
      <ShopFilters value={filters} onChange={(newFilters) => { setFilters(newFilters); setPage(1); setAllProducts([]); }} onReset={() => { setFilters(DEFAULT_FILTERS); setPage(1); setAllProducts([]); }} />

      {loading && page === 1 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="aspect-[.82] animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : allProducts.length > 0 ? (
        <>
          <Grid cols={1} sm={2} lg={3} xl={4} gap="4" className="sm:gap-5">{allProducts.map((product) => <ShopProductCard key={product.id} product={product} currency={currency} locale={locale} />)}</Grid>
          {hasMore && <div className="flex justify-center pt-2"><button type="button" disabled={loadingMore} onClick={() => setPage((p) => p + 1)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60">{loadingMore ? '…' : locale === 'en' ? 'Load more' : locale === 'ps' ? 'نور وګورئ' : 'نمایش بیشتر'}</button></div>}
          {!hasMore && meta && <p className="pt-2 text-center text-xs text-muted-foreground">{locale === 'en' ? `All ${totalCount.toLocaleString()} products shown` : locale === 'ps' ? `ټول ${totalCount.toLocaleString()} محصولات وښودل شول` : `همه ${totalCount.toLocaleString('fa-IR')} محصول نمایش داده شد`}</p>}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center sm:py-20">
          <PackageSearch className="h-10 w-10 text-muted-foreground/60" aria-hidden />
          <div><h3 className="font-display text-lg font-semibold text-foreground">{locale === 'en' ? 'No products found' : locale === 'ps' ? 'هیڅ محصول ونه موندل شو' : 'محصولی یافت نشد'}</h3><p className="mt-1 text-sm text-muted-foreground">{locale === 'en' ? 'Try another category or clear your filters.' : locale === 'ps' ? 'بلې کټګورۍ ته لاړ شئ یا فلټرونه پاک کړئ.' : 'دسته دیگری را امتحان کنید یا فیلترها را پاک کنید.'}</p></div>
          <button type="button" onClick={clear} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">{locale === 'en' ? 'Clear filters' : locale === 'ps' ? 'فلټرونه پاک کړئ' : 'پاک کردن فیلترها'}</button>
        </div>
      )}
    </Stack>
  );
}
