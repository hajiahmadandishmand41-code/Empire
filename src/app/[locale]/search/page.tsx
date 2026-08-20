'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X, SlidersHorizontal, ArrowLeft, ChevronDown, Star, RotateCcw } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { ShopProductCard } from '@/features/shop/components/shop-product-card';
import type { ProductSummary } from '@/types';

const SORTS = ['relevance', 'bestSelling', 'popular', 'newest', 'priceAsc', 'priceDesc', 'rating'] as const;
type Sort = typeof SORTS[number];

type StoreResult = { id: string; name: string; bio: string | null; logoUrl: string | null; city: string | null; productCount: number; href: string };
type FacetOption = { value: string; label: string; count: number };
type SearchMeta = {
  total: number; page: number; pageSize: number; hasMore: boolean; query: string;
  facets?: { categories: FacetOption[]; sellers: Array<FacetOption & { id: string }>; brands: FacetOption[]; price: { min: number; max: number } | null };
  stores?: StoreResult[];
};

const copy = (locale: string) => locale === 'en'
  ? { title: 'Search', placeholder: 'Search products, brands and stores…', relevance: 'Most relevant', bestSelling: 'Best selling', popular: 'Most popular', newest: 'Newest', priceAsc: 'Price: low to high', priceDesc: 'Price: high to low', rating: 'Top rated', filters: 'Filters', sort: 'Sort', results: 'results', active: 'Active filters', clear: 'Clear all', noResults: 'No results found', noResultsText: 'Try another search or adjust your filters.', retry: 'Try again', trending: 'Popular products', minPrice: 'Minimum price', maxPrice: 'Maximum price', ratingLabel: 'Rating', availability: 'Availability', inStock: 'In stock', discount: 'On sale', category: 'Category', seller: 'Seller', brand: 'Brand', apply: 'Apply', close: 'Close' }
  : locale === 'ps'
    ? { title: 'لټون', placeholder: 'محصول، برانډ او پلورنځي ولټوئ…', relevance: 'ډېر اړوند', bestSelling: 'ډېر پلورل شوي', popular: 'ډېر مشهور', newest: 'نوي', priceAsc: 'ارزانه تر ګران', priceDesc: 'ګران تر ارزانه', rating: 'لوړه درجه', filters: 'فلټرونه', sort: 'ترتیب', results: 'پایلې', active: 'فعال فلټرونه', clear: 'ټول پاک کړه', noResults: 'پایله ونه موندل شوه', noResultsText: 'بل لټون یا بل فلټر وکاروئ.', retry: 'بیا هڅه', trending: 'مشهور محصولات', minPrice: 'لږ تر لږه بیه', maxPrice: 'تر ټولو لوړه بیه', ratingLabel: 'درجه', availability: 'موجودیت', inStock: 'په ذخیره کې', discount: 'تخفیف', category: 'وېشنیزه', seller: 'پلورونکی', brand: 'برانډ', apply: 'پلي کول', close: 'بندول' }
    : { title: 'جستجو', placeholder: 'جستجوی محصول، برند و فروشگاه…', relevance: 'مرتبط‌ترین', bestSelling: 'پرفروش‌ترین', popular: 'محبوب‌ترین', newest: 'جدیدترین', priceAsc: 'ارزان‌ترین', priceDesc: 'گران‌ترین', rating: 'بالاترین امتیاز', filters: 'فیلترها', sort: 'مرتب‌سازی', results: 'نتیجه', active: 'فیلترهای فعال', clear: 'حذف همه', noResults: 'نتیجه‌ای یافت نشد', noResultsText: 'جستجوی دیگری امتحان کنید یا فیلترها را تغییر دهید.', retry: 'تلاش دوباره', trending: 'محصولات محبوب', minPrice: 'حداقل قیمت', maxPrice: 'حداکثر قیمت', ratingLabel: 'امتیاز', availability: 'موجودی', inStock: 'فقط موجودها', discount: 'فقط تخفیف‌دارها', category: 'دسته‌بندی', seller: 'فروشنده', brand: 'برند', apply: 'اعمال', close: 'بستن' };

function sortLabel(value: Sort, locale: string) {
  const t = copy(locale);
  return t[value === 'priceAsc' ? 'priceAsc' : value === 'priceDesc' ? 'priceDesc' : value];
}

function SkeletonGrid() {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card"><div className="aspect-[4/3] animate-pulse bg-muted" /><div className="space-y-2 p-3"><div className="h-3 w-2/3 animate-pulse rounded bg-muted" /><div className="h-4 w-full animate-pulse rounded bg-muted" /><div className="h-4 w-1/2 animate-pulse rounded bg-muted" /></div></div>)}</div>;

function SelectBox({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <label className="block space-y-1.5"><span className="text-xs font-bold text-muted-foreground">{label}</span><div className="relative"><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-border bg-background px-3 pe-9 text-xs font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden /></div></label>;
}

export default function SearchPage() {
  const locale = useLocale();
  const t = copy(locale);
  const params = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [sort, setSort] = useState<Sort>((params.get('sort') as Sort) || 'relevance');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [seller, setSeller] = useState(params.get('seller') ?? '');
  const [brand, setBrand] = useState(params.get('brand') ?? '');
  const [minPrice, setMinPrice] = useState(params.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') ?? '');
  const [minRating, setMinRating] = useState(params.get('rating') ?? '');
  const [inStock, setInStock] = useState(params.get('inStock') === 'true');
  const [discount, setDiscount] = useState(params.get('discount') === 'true');
  const [appliedQuery, setAppliedQuery] = useState(params.get('q') ?? '');
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [mobileSheet, setMobileSheet] = useState<'filters' | 'sort' | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const queryString = useMemo(() => {
    const next = new URLSearchParams();
    if (appliedQuery.trim()) next.set('q', appliedQuery.trim());
    if (category) next.set('category', category);
    if (seller) next.set('seller', seller);
    if (brand) next.set('brand', brand);
    if (minPrice) next.set('minPrice', minPrice);
    if (maxPrice) next.set('maxPrice', maxPrice);
    if (minRating) next.set('rating', minRating);
    if (inStock) next.set('inStock', 'true');
    if (discount) next.set('discount', 'true');
    if (sort !== 'relevance') next.set('sort', sort);
    return next.toString();
  }, [appliedQuery, category, seller, brand, minPrice, maxPrice, minRating, inStock, discount, sort]);

  const syncUrl = useCallback((nextQuery = appliedQuery) => {
    const next = new URLSearchParams(queryString);
    if (nextQuery.trim()) next.set('q', nextQuery.trim()); else next.delete('q');
    const href = next.toString() ? `/search?${next.toString()}` : '/search';
    router.replace(href);
  }, [appliedQuery, queryString, router]);

  useEffect(() => {
    const nextQuery = params.get('q') ?? '';
    const nextSort = (params.get('sort') as Sort) || 'relevance';
    if (nextQuery !== appliedQuery) { setQuery(nextQuery); setAppliedQuery(nextQuery); }
    if (nextSort !== sort) setSort(nextSort);
    const pairs: Array<[string, (value: string) => void]> = [
      ['category', setCategory], ['seller', setSeller], ['brand', setBrand], ['minPrice', setMinPrice], ['maxPrice', setMaxPrice], ['rating', setMinRating],
    ];
    pairs.forEach(([key, setter]) => setter(params.get(key) ?? ''));
    setInStock(params.get('inStock') === 'true');
    setDiscount(params.get('discount') === 'true');
  }, [params]); // URL is source of truth

  const fetchSearch = useCallback(async (requestedPage: number, append: boolean) => {
    setLoading(true); setError(false);
    try {
      const api = new URLSearchParams({ page: String(requestedPage), pageSize: '12', sort });
      if (appliedQuery.trim()) api.set('q', appliedQuery.trim());
      if (category) api.set('categoryKey', category);
      if (seller) api.set('sellerId', seller);
      if (brand) api.set('brand', brand);
      if (minPrice) api.set('priceMin', minPrice);
      if (maxPrice) api.set('priceMax', maxPrice);
      if (minRating) api.set('minRating', minRating);
      if (inStock) api.set('inStock', 'true');
      if (discount) api.set('hasDiscount', 'true');
      const response = await fetch(`/api/search?${api.toString()}`, { credentials: 'same-origin', cache: 'no-store' });
      const payload = await response.json() as { ok?: boolean; data?: ProductSummary[]; meta?: SearchMeta };
      if (!response.ok || !payload.ok) throw new Error('search_failed');
      setProducts((current) => append ? [...current, ...(payload.data ?? [])] : (payload.data ?? []));
      setMeta(payload.meta ?? null);
    } catch {
      setError(true);
      if (!append) setProducts([]);
    } finally { setLoading(false); }
  }, [appliedQuery, category, seller, brand, minPrice, maxPrice, minRating, inStock, discount, sort]);

  useEffect(() => { setPage(1); void fetchSearch(1, false); }, [fetchSearch]);
  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && meta?.hasMore && !loading) setPage((value) => value + 1);
    }, { rootMargin: '320px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [meta?.hasMore, loading]);
  useEffect(() => { if (page > 1) void fetchSearch(page, true); }, [page, fetchSearch]);

  const facets = meta?.facets;
  const activeCount = [category, seller, brand, minPrice, maxPrice, minRating, inStock ? 'stock' : '', discount ? 'discount' : '', sort !== 'relevance' ? sort : ''].filter(Boolean).length;
  const applyQuery = () => { setAppliedQuery(query); syncUrl(query); setMobileSheet(null); };
  const clearFilters = () => {
    setCategory(''); setSeller(''); setBrand(''); setMinPrice(''); setMaxPrice(''); setMinRating(''); setInStock(false); setDiscount(false); setSort('relevance'); setPage(1); setMobileSheet(null);
    const href = appliedQuery.trim() ? `/search?q=${encodeURIComponent(appliedQuery.trim())}` : '/search';
    router.replace(href);
  };

  const categoryOptions = [{ value: '', label: t.category }, ...(facets?.categories ?? []).map((item) => ({ value: item.value, label: `${item.label} (${item.count})` }))];
  const sellerOptions = [{ value: '', label: t.seller }, ...(facets?.sellers ?? []).map((item) => ({ value: item.id, label: `${item.label} (${item.count})` }))];
  const brandOptions = [{ value: '', label: t.brand }, ...(facets?.brands ?? []).map((item) => ({ value: item.value, label: `${item.label} (${item.count})` }))];
  const sortOptions = SORTS.map((value) => ({ value, label: sortLabel(value, locale) }));

  const filterPanel = <div className="space-y-4">
    <SelectBox label={t.category} value={category} options={categoryOptions} onChange={(value) => { setCategory(value); syncUrl(appliedQuery); }} />
    {sellerOptions.length > 1 && <SelectBox label={t.seller} value={seller} options={sellerOptions} onChange={(value) => { setSeller(value); syncUrl(appliedQuery); }} />}
    {brandOptions.length > 1 && <SelectBox label={t.brand} value={brand} options={brandOptions} onChange={(value) => { setBrand(value); syncUrl(appliedQuery); }} />}
    <div className="space-y-2"><p className="text-xs font-bold text-muted-foreground">{t.minPrice} / {t.maxPrice}</p><div className="grid grid-cols-2 gap-2"><input inputMode="numeric" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="0" className="h-10 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-primary" /><input inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder={facets?.price ? String(Math.round(facets.price.max)) : '∞'} className="h-10 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-primary" /></div><button type="button" onClick={() => syncUrl(appliedQuery)} className="w-full rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">{t.apply}</button></div>
    <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-xs font-semibold"><span>{t.inStock}</span><input type="checkbox" checked={inStock} onChange={(event) => { setInStock(event.target.checked); setTimeout(() => syncUrl(appliedQuery), 0); }} className="h-4 w-4 accent-primary" /></label>
    <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-xs font-semibold"><span>{t.discount}</span><input type="checkbox" checked={discount} onChange={(event) => { setDiscount(event.target.checked); setTimeout(() => syncUrl(appliedQuery), 0); }} className="h-4 w-4 accent-primary" /></label>
    <div className="space-y-2"><p className="text-xs font-bold text-muted-foreground">{t.ratingLabel}</p><div className="flex gap-2">{['4', '3'].map((value) => <button key={value} type="button" onClick={() => { setMinRating(minRating === value ? '' : value); setTimeout(() => syncUrl(appliedQuery), 0); }} className={`flex flex-1 items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold ${minRating === value ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{value}+</button>)}</div></div>
  </div>;

  return <div className="min-h-dvh bg-background"><SiteHeader /><main id="main" className="pb-20 md:pb-0"><div className="mx-auto max-w-screen-xl px-3 py-5 sm:px-6 sm:py-8">
    <div className="mb-4 rounded-3xl border border-border bg-card p-3 shadow-sm sm:p-4"><div className="relative"><Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') applyQuery(); }} placeholder={t.placeholder} aria-label={t.title} className="h-14 w-full rounded-2xl border border-border bg-muted/30 px-12 pe-12 text-sm font-semibold outline-none focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15" />{query && <button type="button" onClick={() => { setQuery(''); setAppliedQuery(''); router.replace('/search'); }} aria-label={t.clear} className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>}</div></div>

    <div className="mb-4 flex gap-2 lg:hidden"><button type="button" onClick={() => setMobileSheet('filters')} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold"><SlidersHorizontal className="h-4 w-4" />{t.filters}{activeCount > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{activeCount}</span>}</button><button type="button" onClick={() => setMobileSheet('sort')} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold"><ChevronDown className="h-4 w-4" />{t.sort}: {sortLabel(sort, locale)}</button></div>

    <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="hidden lg:block"><div className="sticky top-24 rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-extrabold">{t.filters}</h2>{activeCount > 0 && <button type="button" onClick={clearFilters} className="text-[11px] font-bold text-primary">{t.clear}</button>}</div>{filterPanel}</div></aside>
      <section className="min-w-0"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-black tracking-tight sm:text-2xl">{appliedQuery ? `${t.title}: ${appliedQuery}` : t.trending}</h1><p className="mt-1 text-xs text-muted-foreground">{(meta?.total ?? products.length).toLocaleString(locale === 'en' ? 'en-US' : 'fa-IR')} {t.results}</p></div><div className="hidden sm:block"><SelectBox label={t.sort} value={sort} options={sortOptions} onChange={(value) => { setSort(value as Sort); setTimeout(() => syncUrl(appliedQuery), 0); }} /></div></div>
        {(activeCount > 0) && <div className="mb-4 flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold text-muted-foreground">{t.active}:</span>{category && <button type="button" onClick={() => { setCategory(''); setTimeout(() => syncUrl(appliedQuery), 0); }} className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold">{t.category} ×</button>}{seller && <button type="button" onClick={() => { setSeller(''); setTimeout(() => syncUrl(appliedQuery), 0); }} className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold">{t.seller} ×</button>}{brand && <button type="button" onClick={() => { setBrand(''); setTimeout(() => syncUrl(appliedQuery), 0); }} className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold">{t.brand} ×</button>}{(minPrice || maxPrice) && <button type="button" onClick={() => { setMinPrice(''); setMaxPrice(''); setTimeout(() => syncUrl(appliedQuery), 0); }} className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold">{t.minPrice}/{t.maxPrice} ×</button>}{minRating && <button type="button" onClick={() => { setMinRating(''); setTimeout(() => syncUrl(appliedQuery), 0); }} className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold">{t.ratingLabel} {minRating}+ ×</button>}{(inStock || discount) && <button type="button" onClick={() => { setInStock(false); setDiscount(false); setTimeout(() => syncUrl(appliedQuery), 0); }} className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold">{t.availability}/{t.discount} ×</button>}<button type="button" onClick={clearFilters} className="ms-auto inline-flex items-center gap-1 text-[11px] font-bold text-primary"><RotateCcw className="h-3 w-3" />{t.clear}</button></div>}

        {error ? <div className="rounded-2xl border border-dashed border-destructive/30 bg-card px-6 py-16 text-center"><p className="text-base font-black">{t.noResults}</p><p className="mt-2 text-xs text-muted-foreground">{t.noResultsText}</p><button type="button" onClick={() => void fetchSearch(1, false)} className="mt-5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">{t.retry}</button></div>
          : loading && products.length === 0 ? <SkeletonGrid />
          : products.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center"><p className="text-base font-black">{appliedQuery ? t.noResults : t.trending}</p><p className="mt-2 text-xs text-muted-foreground">{t.noResultsText}</p></div>
          : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ShopProductCard key={product.id} product={product} locale={locale} currency="AFN" />)}</div>}

        <div ref={loaderRef} className="h-12 pt-5 text-center text-xs text-muted-foreground">{loading && products.length > 0 ? '…' : meta?.hasMore ? ' ' : products.length > 0 ? ' ' : ''}</div>
      </section>
    </div>
  </div></main>

  {mobileSheet && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label={t.close} onClick={() => setMobileSheet(null)} className="absolute inset-0 bg-black/45" /><div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 pb-safe shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-black">{mobileSheet === 'filters' ? t.filters : t.sort}</h2><button type="button" onClick={() => setMobileSheet(null)} className="rounded-full p-2 hover:bg-muted" aria-label={t.close}><X className="h-4 w-4" /></button></div>{mobileSheet === 'filters' ? filterPanel : <div className="space-y-2">{sortOptions.map((item) => <button key={item.value} type="button" onClick={() => { setSort(item.value as Sort); setMobileSheet(null); setTimeout(() => syncUrl(appliedQuery), 0); }} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold ${sort === item.value ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>{item.label}{sort === item.value ? '✓' : ''}</button>)}</div>}</div></div>}
  <SiteFooter /><BottomNavigation /></div>;
}
