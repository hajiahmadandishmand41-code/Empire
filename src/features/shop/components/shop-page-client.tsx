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

interface ShopPageClientProps {
  locale: string;
  currency?: string;
}

const DEFAULT_FILTERS: ShopFiltersValue = {
  priceMin: '',
  priceMax: '',
  inStockOnly: false,
  sellerId: '',
  sort: 'recommended',
};

const PAGE_SIZE = 24;
const DEBOUNCE_MS = 350;

function unwrap<T>(payload: unknown, fallback: T): T {
  const body = payload as { ok?: boolean; data?: T };
  return body?.ok && body.data !== undefined ? body.data : fallback;
}

interface ApiMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}

/** Map ShopFiltersValue.sort → API sort enum */
function toApiSort(sort: ShopFiltersValue['sort']): string {
  switch (sort) {
    case 'price_asc':  return 'priceAsc';
    case 'price_desc': return 'priceDesc';
    case 'popular':    return 'popular';
    case 'recommended': return 'recommended';
    default:           return 'recommended';
  }
}

export function ShopPageClient({ locale, currency = 'AFN' }: ShopPageClientProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('categoryKey') ?? searchParams.get('category');
  const initialSort = searchParams.get('sort');
  const initialBadge = searchParams.get('badge');

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [category, setCategory] = React.useState<string | 'all'>(initialCategory || 'all');
  const [filters, setFilters] = React.useState<ShopFiltersValue>(() => ({
    ...DEFAULT_FILTERS,
    sort:
      initialSort === 'priceAsc'    ? 'price_asc'
      : initialSort === 'priceDesc' ? 'price_desc'
      : initialSort === 'popular' || initialSort === 'bestSelling' ? 'popular'
      : 'recommended',
  }));

  const [products, setProducts] = React.useState<ProductSummary[]>([]);
  const [allProducts, setAllProducts] = React.useState<ProductSummary[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [meta, setMeta] = React.useState<ApiMeta | null>(null);

  // Debounce search input — only fires API after 350ms of no typing
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page and accumulated products when filters/search/category change
  React.useEffect(() => {
    setPage(1);
    setAllProducts([]);
  }, [debouncedSearch, category, filters, initialBadge]);

  // Fetch categories once on mount
  React.useEffect(() => {
    fetch('/api/categories', { cache: 'no-store' })
      .then((res) => res.json())
      .then((body) => setCategories(unwrap(body, [])))
      .catch(() => setCategories([]));
  }, []);

  // Main data fetch — triggers on filter/search/category/page changes
  React.useEffect(() => {
    const controller = new AbortController();
    const isLoadMore = page > 1;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    if (category !== 'all') params.set('categoryKey', category);
    if (initialBadge) params.set('badge', initialBadge);
    if (filters.priceMin !== '') params.set('priceMin', String(filters.priceMin));
    if (filters.priceMax !== '') params.set('priceMax', String(filters.priceMax));
    if (filters.inStockOnly) params.set('inStock', 'true');
    params.set('sort', toApiSort(filters.sort));
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));

    fetch(`/api/products?${params.toString()}`, { cache: 'no-store', signal: controller.signal })
      .then((res) => res.json())
      .then((body) => {
        const newProducts = unwrap<ProductSummary[]>(body, []);
        const bodyMeta = (body as { meta?: ApiMeta }).meta ?? null;
        setMeta(bodyMeta);
        setProducts(newProducts);
        if (isLoadMore) {
          setAllProducts((prev) => [...prev, ...newProducts]);
        } else {
          setAllProducts(newProducts);
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          setProducts([]);
          if (!isLoadMore) setAllProducts([]);
        }
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });

    return () => controller.abort();
  // page is intentionally separate from the reset effect above
  
  }, [debouncedSearch, category, filters, initialBadge, page]);

  const categoryOptions = React.useMemo<ShopCategoryOption[]>(
    () => [
      { key: 'all', label: 'همه محصولات' },
      ...categories.map((item) => ({ key: item.key, label: item.name, count: item.productCount })),
    ],
    [categories],
  );

  const clear = React.useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('all');
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setAllProducts([]);
  }, []);

  const hasMore = meta?.hasMore ?? false;
  const totalCount = meta?.total ?? allProducts.length;

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

      {/* Loading state (initial load) */}
      {loading && page === 1 ? (
        <div className="rounded-2xl border border-border bg-card py-20 text-center text-sm text-muted-foreground">
          در حال بارگذاری محصولات…
        </div>
      ) : allProducts.length > 0 ? (
        <>
          <Grid cols={1} sm={2} lg={3} xl={3} gap="4" className="sm:gap-6">
            {allProducts.map((product) => (
              <ShopProductCard
                key={product.id}
                product={product}
                currency={currency}
                locale={locale}
              />
            ))}
          </Grid>

          {/* Load More button */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-rose-300 hover:text-rose-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" aria-hidden />
                    در حال بارگذاری…
                  </>
                ) : (
                  'نمایش بیشتر'
                )}
              </button>
            </div>
          )}

          {/* End of results */}
          {!hasMore && allProducts.length > 0 && meta && (
            <p className="text-center text-xs text-muted-foreground pt-2">
              همه {totalCount.toLocaleString('fa-IR')} محصول نمایش داده شد
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center sm:py-20">
          <PackageSearch className="h-10 w-10 text-muted-foreground/60" aria-hidden />
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">محصولی یافت نشد</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              محصولات واقعی فروشندگان پس از ثبت در اینجا نمایش داده می‌شوند.
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            پاک کردن فیلترها
          </button>
        </div>
      )}
    </Stack>
  );
}
