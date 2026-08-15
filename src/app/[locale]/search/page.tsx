'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import {
  Search, X, Package, SlidersHorizontal,
  ArrowUpDown, Tag, DollarSign, ChevronDown,
  ArrowLeft, Star,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images?: Array<{ url: string }>;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  category?: { name: string };
  sellerWhatsapp?: string;
}

interface SearchMeta {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  query: string;
}

type SortOption = 'newest' | 'cheapest' | 'expensive' | 'popular';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',    label: 'جدیدترین'   },
  { value: 'cheapest',  label: 'ارزان‌ترین'  },
  { value: 'expensive', label: 'گران‌ترین'   },
  { value: 'popular',   label: 'محبوب‌ترین' },
];

/**
 * FIX: Map frontend sort UI values to API sort enum.
 * The API accepts: newest | priceAsc | priceDesc | bestSelling | mostViewed | popular
 * The UI uses:     newest | cheapest | expensive | popular
 */
const SORT_API_MAP: Record<SortOption, string> = {
  newest:    'newest',
  cheapest:  'priceAsc',
  expensive: 'priceDesc',
  popular:   'popular',
};

const CATEGORY_OPTIONS = [
  { value: '',               label: 'همه دسته‌ها'          },
  { value: 'clothing',       label: 'پوشاک'                 },
  { value: 'digital',        label: 'دیجیتال'               },
  { value: 'homeAppliances', label: 'لوازم خانگی'           },
  { value: 'beauty',         label: 'آرایشی و بهداشتی'     },
  { value: 'sports',         label: 'ورزشی'                 },
  { value: 'footwear',       label: 'کفش'                   },
  { value: 'baby',           label: 'کودک'                  },
  { value: 'traditional',    label: 'محصولات سنتی'         },
];

const PRICE_RANGES = [
  { value: '',          label: 'همه قیمت‌ها'                  },
  { value: '0-500',     label: 'زیر ۵۰۰ افغانی'              },
  { value: '500-2000',  label: '۵۰۰ تا ۲,۰۰۰ افغانی'        },
  { value: '2000-10000',label: '۲,۰۰۰ تا ۱۰,۰۰۰ افغانی'    },
  { value: '10000-',    label: 'بالای ۱۰,۰۰۰ افغانی'        },
];

const DEBOUNCE_MS = 300;

/* ─── Product Card ─── */
function SearchResultCard({ product }: { product: Product }) {
  const image = product.images?.[0]?.url;
  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-rose-200 dark:hover:border-rose-800 hover:shadow-lg hover:-translate-y-0.5">
      {discountPct > 0 && (
        <span className="absolute start-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
          -{discountPct}٪
        </span>
      )}
      <button
        type="button"
        aria-label="افزودن به علاقه‌مندی‌ها"
        className="absolute end-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow-sm opacity-0 transition-all hover:text-rose-500 group-hover:opacity-100 border border-border"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <Package className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {product.category && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">{product.category.name}</p>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          <Link href={`/shop/${product.slug}`} className="hover:text-rose-600 transition-colors">
            {product.name}
          </Link>
        </h3>

        {product.rating !== undefined && product.rating > 0 && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn('h-2.5 w-2.5', i < Math.round(product.rating!) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground')}
                aria-hidden="true"
              />
            ))}
            {product.reviewCount !== undefined && product.reviewCount > 0 && (
              <span className="text-[10px] text-muted-foreground ms-0.5">({product.reviewCount})</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-border pt-2.5">
          <div>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="block text-[10px] text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice, 'AFN', 'fa')}
              </span>
            )}
            <span className={cn('font-bold text-sm', discountPct > 0 ? 'text-rose-600' : 'text-foreground')}>
              {formatPrice(product.price, 'AFN', 'fa')}
            </span>
          </div>
          <Link
            href={`/shop/${product.slug}`}
            className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-rose-700 transition-colors"
          >
            مشاهده
            <ArrowLeft className="h-2.5 w-2.5 icon-directional" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ─── Skeleton Card ─── */
function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-2 w-16 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2.5">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-7 w-16 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

/* ─── Filter Dropdown ─── */
function FilterDropdown<T extends string>({
  label,
  icon: Icon,
  options,
  value,
  onChange,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
          value
            ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
            : 'border-border bg-card text-foreground hover:border-rose-300 dark:hover:border-rose-700',
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {selected?.label ?? label}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div className="absolute start-0 top-full mt-1.5 z-50 min-w-[160px] rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value as T); setOpen(false); }}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors text-start',
                opt.value === value
                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-semibold'
                  : 'text-foreground hover:bg-muted',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Search Page ─── */
function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [sort, setSort] = useState<SortOption>('newest');
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const loaderRef = useRef<HTMLDivElement>(null);

  /* ── Debounce: 300ms after user stops typing ── */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  /* ── Build URL with correct API parameter names ── */
  const buildUrl = useCallback((q: string, p: number, s: SortOption, cat: string, pr: string) => {
    const params = new URLSearchParams({
      q,
      page: String(p),
      pageSize: '12',
      // FIX: map frontend sort values to API enum (cheapest→priceAsc, expensive→priceDesc)
      sort: SORT_API_MAP[s],
    });
    if (cat) params.set('categoryKey', cat);
    if (pr) {
      const [min, max] = pr.split('-');
      // FIX: API uses priceMin/priceMax NOT minPrice/maxPrice
      if (min) params.set('priceMin', min);
      if (max && max !== '') params.set('priceMax', max);
    }
    return `/api/search?${params.toString()}`;
  }, []);

  /* ── Fetch function ── */
  const fetchProducts = useCallback(async (
    q: string, p: number, reset: boolean,
    s: SortOption, cat: string, pr: string,
  ) => {
    if (!q.trim() || q.trim().length < 2) {
      if (reset) { setProducts([]); setMeta(null); setHasMore(false); }
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(buildUrl(q, p, s, cat, pr));
      const data = await res.json() as {
        ok?: boolean;
        data?: Product[];
        meta?: SearchMeta;
      };
      if (data?.ok) {
        const newProducts: Product[] = Array.isArray(data.data) ? data.data : [];
        setProducts((prev) => (reset ? newProducts : [...prev, ...newProducts]));
        setMeta(data.meta ?? null);
        // FIX: Use data.meta?.hasMore — the API returns hasMore, NOT pages
        setHasMore(data.meta?.hasMore ?? false);
      }
    } catch {
      /* network error — keep previous state */
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  /* ── Re-fetch when debouncedQuery or filters change (reset to page 1) ── */
  const filterKey = `${sort}|${category}|${priceRange}`;
  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(false);
    if (debouncedQuery.trim().length >= 2) {
      fetchProducts(debouncedQuery, 1, true, sort, category, priceRange);
    } else {
      setMeta(null);
    }
    // filterKey is a stable string derived from sort/category/priceRange
    
  }, [debouncedQuery, filterKey]);

  /* ── Load next page when page increments ── */
  const prevPage = useRef(1);
  useEffect(() => {
    if (page > 1 && page !== prevPage.current && debouncedQuery.trim().length >= 2) {
      prevPage.current = page;
      fetchProducts(debouncedQuery, page, false, sort, category, priceRange);
    }
    
  }, [page]);

  /* ── IntersectionObserver for infinite scroll ── */
  // Use a ref-snapshot so the observer callback always sees the latest values
  // without needing to re-create the observer on every state change.
  const latestRef = useRef({ hasMore, loading, page });
  useEffect(() => {
    latestRef.current = { hasMore, loading, page };
  });

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        const { hasMore: h, loading: l } = latestRef.current;
        if (h && !l) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.3, rootMargin: '100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  // Re-create observer only when products list changes (after a new page loads)
  
  }, [products.length]);

  /* ── Sync query with URL param (header search navigation) ── */
  useEffect(() => {
    const urlQ = searchParams.get('q') ?? '';
    if (urlQ !== query) {
      setQuery(urlQ);
      setDebouncedQuery(urlQ); // No debounce delay for URL-driven navigation
    }
    
  }, [searchParams]);

  const activeFilters = [sort !== 'newest', !!category, !!priceRange].filter(Boolean).length;
  const isTyping = query !== debouncedQuery;

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh bg-background">
        {/* ── Sticky toolbar ── */}
        <div className="sticky top-[calc(var(--header-height,112px)+0px)] z-30 border-b border-border bg-background/95 backdrop-blur-md shadow-sm">
          <div className="mx-auto max-w-screen-xl px-3 sm:px-6">

            {/* Search input */}
            <div className="py-2.5 flex items-center gap-2">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2">
                  {isTyping ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                  ) : (
                    <Search className="h-4 w-4 text-rose-500" aria-hidden />
                  )}
                </div>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجو در محصولات..."
                  className="w-full rounded-xl border border-border bg-card py-2 ps-9 pe-9 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/15"
                  aria-label="جستجوی محصولات"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(''); setDebouncedQuery(''); }}
                    aria-label="پاک کردن جستجو"
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
              {meta && !isTyping && (
                <span className="shrink-0 text-xs text-muted-foreground hidden sm:inline whitespace-nowrap">
                  {meta.total.toLocaleString('fa-IR')} نتیجه
                </span>
              )}
            </div>

            {/* Filter toolbar */}
            <div className="flex items-center gap-2 pb-3 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden />
                {activeFilters > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                    {activeFilters}
                  </span>
                )}
              </div>

              <div className="w-px h-5 bg-border shrink-0" />

              <FilterDropdown
                label="مرتب‌سازی"
                icon={ArrowUpDown}
                options={SORT_OPTIONS}
                value={sort}
                onChange={(v) => setSort(v as SortOption)}
              />
              <FilterDropdown
                label="دسته‌بندی"
                icon={Tag}
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={setCategory}
              />
              <FilterDropdown
                label="قیمت"
                icon={DollarSign}
                options={PRICE_RANGES}
                value={priceRange}
                onChange={setPriceRange}
              />

              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={() => { setSort('newest'); setCategory(''); setPriceRange(''); }}
                  className="flex shrink-0 items-center gap-1 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                >
                  <X className="h-3 w-3" aria-hidden />
                  حذف فیلترها
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="mx-auto max-w-screen-xl px-3 sm:px-6 py-5">

          {/* Results count */}
          {meta && !isTyping && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{meta.total.toLocaleString('fa-AF')}</span> نتیجه برای «{meta.query}»
              </p>
            </div>
          )}

          {/* Empty state — no query */}
          {!debouncedQuery.trim() && !isTyping && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted text-4xl">🔍</div>
              <h2 className="text-lg font-bold text-foreground mb-2">جستجو کنید</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                نام محصول، دسته‌بندی یا فروشگاه مورد نظرتان را وارد کنید.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {['زعفران', 'قالین', 'موبایل', 'پوشاک', 'عسل'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setQuery(term);
                      setDebouncedQuery(term);
                      router.push(('/search?q=' + encodeURIComponent(term)) as Parameters<typeof router.push>[0]);
                    }}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-rose-300 hover:text-rose-600 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {!loading && !isTyping && debouncedQuery.trim() && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted text-4xl">📦</div>
              <h2 className="text-lg font-bold text-foreground mb-2">نتیجه‌ای یافت نشد</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                جستجوی دیگری امتحان کنید یا با کلمات ساده‌تر جستجو کنید.
              </p>
              <Link href="/shop" className="mt-4 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors">
                مشاهده همه محصولات
              </Link>
            </div>
          )}

          {/* Product grid */}
          {(products.length > 0 || (loading && page === 1)) && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {products.map((p) => (
                <SearchResultCard key={p.id} product={p} />
              ))}
              {loading && page === 1 &&
                Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
              }
            </div>
          )}

          {/* Infinite scroll trigger + loading indicator */}
          <div ref={loaderRef} className="py-4 flex justify-center">
            {loading && page > 1 && (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
            )}
            {!hasMore && products.length > 0 && !loading && (
              <p className="text-center text-sm text-muted-foreground">
                همه نتایج نمایش داده شد
              </p>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}
