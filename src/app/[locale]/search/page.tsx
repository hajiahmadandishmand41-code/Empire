'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Package, ChevronDown, ArrowLeft, Star, RotateCcw, Store, MapPin, LayoutGrid } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn, formatPrice } from '@/lib/utils';
import { useRouter } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';

type SortOption = 'newest' | 'cheapest' | 'expensive' | 'popular';
type Locale = 'fa' | 'ps' | 'en';
interface Product { id: string; name: string; slug: string; price: number; compareAtPrice?: number | null; images?: Array<{ url: string }>; rating?: number; reviewCount?: number; category?: { name: string } }
interface StoreResult { id: string; name: string; bio?: string | null; logoUrl?: string | null; city?: string | null; productCount: number; href: string }
interface SearchMeta { total: number; page: number; pageSize: number; hasMore: boolean; query: string; stores?: StoreResult[]; storeCount?: number }
interface SearchCopy { search: string; searchAria: string; sort: string; category: string; price: string; clear: string; view: string; results: string; resultsFor: string; emptyTitle: string; emptyText: string; noResults: string; noResultsText: string; allProducts: string; allCategories: string; allPrices: string; newest: string; cheapest: string; expensive: string; popular: string; clearSearch: string; wishlist: string; allShown: string; loading: string; error: string; retry: string; productsTitle: string; storesTitle: string; storeProducts: string; verifiedStore: string; categoriesTitle: string; categoryDigital: string; categoryClothing: string; categoryHome: string; categoryBeauty: string; categorySports: string; categoryTraditional: string; categoryFootwear: string }

const sortApi: Record<SortOption, string> = { newest: 'newest', cheapest: 'priceAsc', expensive: 'priceDesc', popular: 'popular' };

function FilterDropdown<T extends string>({ label, options, value, onChange }: { label: string; options: Array<{ value: T; label: string }>; value: T; onChange: (value: T) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  const selected = options.find((option) => option.value === value);
  return <div ref={ref} className="relative shrink-0"><button type="button" onClick={() => setOpen((current) => !current)} className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/50" aria-expanded={open}>{selected?.label ?? label}<ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} aria-hidden /></button>{open && <div className="absolute start-0 top-full z-50 mt-1.5 min-w-[170px] overflow-hidden rounded-xl border border-border bg-card shadow-lg">{options.map((option) => <button key={option.value} type="button" onClick={() => { onChange(option.value); setOpen(false); }} className={cn('flex w-full px-4 py-2.5 text-start text-xs hover:bg-muted', option.value === value && 'bg-primary/10 font-semibold text-primary')}>{option.label}</button>)}</div>}</div>;
}

function SearchCard({ product, text, locale }: { product: Product; text: SearchCopy; locale: Locale }) {
  const image = product.images?.[0]?.url;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  return <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
    <Link href={`/shop/${product.slug}`} className="relative block aspect-square overflow-hidden bg-muted"><>{image ? <Image src={image} alt={product.name} fill sizes="(max-width:640px) 50vw,(max-width:1024px) 25vw,20vw" className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Package className="h-12 w-12 text-muted-foreground/30" aria-hidden /></div>}{discount > 0 && <span className="absolute start-2 top-2 rounded-md bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">-{discount}%</span>}</></Link>
    <div className="flex flex-1 flex-col gap-2 p-3"><div className="min-h-5">{product.category && <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-primary">{product.category.name}</p>}</div><h2 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5"><Link href={`/shop/${product.slug}`}>{product.name}</Link></h2>{product.rating !== undefined && product.rating > 0 && <div className="flex items-center gap-1">{[0,1,2,3,4].map((i) => <Star key={i} className={cn('h-2.5 w-2.5', i < Math.round(product.rating!) ? 'fill-amber-400 text-amber-400' : 'text-muted')} aria-hidden />)}{product.reviewCount ? <span className="text-[10px] text-muted-foreground">({product.reviewCount})</span> : null}</div>}<div className="mt-auto flex items-end justify-between gap-2 border-t border-border pt-2.5"><div>{discount > 0 && product.compareAtPrice && <span className="block text-[10px] text-muted-foreground line-through">{formatPrice(product.compareAtPrice, 'AFN', locale)}</span>}<span className="font-extrabold text-sm text-primary">{formatPrice(product.price, 'AFN', locale)}</span></div><Link href={`/products/${product.id}`} className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-bold text-primary-foreground">{text.view}<ArrowLeft className="h-2.5 w-2.5 icon-directional" aria-hidden /></Link></div></div>
  </article>;
}

function StoreCard({ store, text }: { store: StoreResult; text: SearchCopy }) {
  return <Link href={store.href} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"><div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted ring-1 ring-border">{store.logoUrl ? <Image src={store.logoUrl} alt={store.name} fill sizes="56px" className="object-cover" /> : <Store className="h-6 w-6 text-muted-foreground" aria-hidden />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-extrabold group-hover:text-primary">{store.name}</h3><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{text.verifiedStore}</span></div>{store.bio && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{store.bio}</p>}<div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground"><span>{store.productCount} {text.storeProducts}</span>{store.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden />{store.city}</span>}</div></div><ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5 icon-directional" aria-hidden /></Link>;
}

export default function SearchPage() {
  const locale = useLocale() as Locale;
  const translate = useTranslations('searchUi');
  const text = useMemo<SearchCopy>(() => ({
    search: translate('search'), searchAria: translate('searchAria'), sort: translate('sort'), category: translate('category'), price: translate('price'), clear: translate('clear'), view: translate('view'), results: translate('results'), resultsFor: translate('resultsFor'), emptyTitle: translate('emptyTitle'), emptyText: translate('emptyText'), noResults: translate('noResults'), noResultsText: translate('noResultsText'), allProducts: translate('allProducts'), allCategories: translate('allCategories'), allPrices: translate('allPrices'), newest: translate('newest'), cheapest: translate('cheapest'), expensive: translate('expensive'), popular: translate('popular'), clearSearch: translate('clearSearch'), wishlist: translate('wishlist'), allShown: translate('allShown'), loading: translate('loading'), error: translate('error'), retry: translate('retry'), productsTitle: translate('productsTitle'), storesTitle: translate('storesTitle'), storeProducts: translate('storeProducts'), verifiedStore: translate('verifiedStore'), categoriesTitle: translate('categoriesTitle'), categoryDigital: translate('categories.digital'), categoryClothing: translate('categories.clothing'), categoryHome: translate('categories.homeAppliances'), categoryBeauty: translate('categories.beauty'), categorySports: translate('categories.sports'), categoryTraditional: translate('categories.traditional'), categoryFootwear: translate('categories.footwear')
  }), [translate]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [debounced, setDebounced] = useState(query);
  const [sort, setSort] = useState<SortOption>('newest');
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const loader = useRef<HTMLDivElement>(null);
  const categories = [
    { key: 'digital', label: text.categoryDigital, href: '/categories' },
    { key: 'clothing', label: text.categoryClothing, href: '/categories' },
    { key: 'home', label: text.categoryHome, href: '/categories' },
    { key: 'beauty', label: text.categoryBeauty, href: '/categories' },
    { key: 'sports', label: text.categorySports, href: '/categories' },
    { key: 'footwear', label: text.categoryFootwear, href: '/categories' },
    { key: 'traditional', label: text.categoryTraditional, href: '/traditional' },
  ];
  const prices = Object.entries({ low: translate('prices.low'), mid: translate('prices.mid'), high: translate('prices.high'), top: translate('prices.top') });

  useEffect(() => { const timer = setTimeout(() => setDebounced(query), 300); return () => clearTimeout(timer); }, [query]);
  useEffect(() => { const next = searchParams.get('q') ?? ''; if (next !== query) { setQuery(next); setDebounced(next); } }, [searchParams, query]);

  const fetchProducts = useCallback(async (requestedPage: number, append: boolean) => {
    if (debounced.trim().length < 2) { setProducts([]); setStores([]); setMeta(null); setHasMore(false); return; }
    setLoading(true); setError(false);
    try {
      const params = new URLSearchParams({ q: debounced.trim(), page: String(requestedPage), pageSize: '12', sort: sortApi[sort] });
      if (category) params.set('categoryKey', category);
      if (priceRange) { const [min, max] = priceRange.split('-'); if (min) params.set('priceMin', min); if (max) params.set('priceMax', max); }
      const response = await fetch(`/api/search?${params.toString()}`, { credentials: 'same-origin' });
      const data = await response.json() as { ok?: boolean; data?: Product[]; meta?: SearchMeta };
      if (!response.ok || !data.ok) throw new Error('search_failed');
      setProducts((current) => append ? [...current, ...(data.data ?? [])] : (data.data ?? []));
      setMeta(data.meta ?? null); setStores(data.meta?.stores ?? []); setHasMore(data.meta?.hasMore ?? false);
    } catch { setError(true); if (!append) { setProducts([]); setStores([]); } } finally { setLoading(false); }
  }, [debounced, sort, category, priceRange]);

  useEffect(() => { setPage(1); void fetchProducts(1, false); }, [fetchProducts]);
  useEffect(() => { const element = loader.current; if (!element) return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && hasMore && !loading) setPage((value) => value + 1); }, { rootMargin: '160px' }); observer.observe(element); return () => observer.disconnect(); }, [hasMore, loading]);
  useEffect(() => { if (page > 1) void fetchProducts(page, true); }, [page, fetchProducts]);

  const sortOptions = [{ value: 'newest' as const, label: text.newest }, { value: 'cheapest' as const, label: text.cheapest }, { value: 'expensive' as const, label: text.expensive }, { value: 'popular' as const, label: text.popular }];
  const categoryOptions = [{ value: '', label: text.allCategories }, { value: 'digital', label: text.categoryDigital }, { value: 'clothing', label: text.categoryClothing }, { value: 'homeAppliances', label: text.categoryHome }, { value: 'beauty', label: text.categoryBeauty }, { value: 'traditional', label: text.categoryTraditional }];
  const priceOptions = [{ value: '', label: text.allPrices }, ...prices.map(([value, label]) => ({ value, label }))];
  const hasFilters = Boolean(category || priceRange || sort !== 'newest');
  function clearAll() { setQuery(''); setCategory(''); setPriceRange(''); setSort('newest'); setProducts([]); setStores([]); setMeta(null); router.push('/search'); }

  return <><SiteHeader /><main id="main" className="min-h-dvh bg-background"><div className="mx-auto max-w-screen-xl px-3 py-5 sm:px-6 sm:py-8">
    <div className="mb-5 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5"><div className="relative"><Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') router.push(`/search?q=${encodeURIComponent(query.trim())}`); }} placeholder={text.search} aria-label={text.searchAria} className="h-14 w-full rounded-2xl border border-border bg-muted/40 px-12 pe-12 text-sm outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15" />{query && <button type="button" onClick={() => setQuery('')} aria-label={text.clearSearch} className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" aria-hidden /></button>}</div></div>
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden self-start lg:block"><div className="sticky top-24 rounded-2xl border border-border bg-card p-3 shadow-sm"><div className="flex items-center gap-2 px-2 pb-3 text-sm font-extrabold"><LayoutGrid className="h-4 w-4 text-primary" />{text.categoriesTitle}</div><div className="space-y-1">{categories.map((item, index) => <Link key={item.key} href={item.href} className={cn('flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold transition-colors hover:bg-muted', item.key === 'traditional' && 'text-primary')}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-base">{['📱','👕','🏠','✨','⚽','👟','🇦🇫'][index]}</span><span className="flex-1">{item.label}</span><ArrowLeft className="h-3 w-3 text-muted-foreground icon-directional" /></Link>)}</div><Link href="/categories" className="mt-2 flex items-center justify-center rounded-xl bg-muted py-2.5 text-xs font-bold text-foreground">{text.allCategories}</Link></div></aside>
      <section className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2"><FilterDropdown label={text.sort} options={sortOptions} value={sort} onChange={setSort} /><FilterDropdown label={text.category} options={categoryOptions} value={category} onChange={setCategory} /><FilterDropdown label={text.price} options={priceOptions} value={priceRange} onChange={setPriceRange} />{hasFilters && <button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"><RotateCcw className="h-3.5 w-3.5" aria-hidden />{text.clear}</button>}</div>
        {error && <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert"><span>{text.error}</span><button type="button" onClick={() => void fetchProducts(1, false)} className="inline-flex items-center gap-1 font-bold"><RotateCcw className="h-3.5 w-3.5" />{text.retry}</button></div>}
        {!query && <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center"><Search className="mx-auto h-9 w-9 text-primary/70" aria-hidden /><h1 className="mt-3 text-xl font-black">{text.emptyTitle}</h1><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{text.emptyText}</p></div>}
        {query && <><div className="mb-5 flex items-end justify-between gap-3"><div><h1 className="text-xl font-extrabold">{text.resultsFor} “{query}”</h1><p className="mt-1 text-xs text-muted-foreground">{meta?.total ?? 0} {text.results} · {meta?.storeCount ?? 0} {text.storesTitle}</p></div>{loading && <span className="text-xs font-semibold text-muted-foreground">{text.loading}</span>}</div>
          {stores.length > 0 && <section className="mb-8"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">{text.storesTitle}</h2><span className="text-xs text-muted-foreground">{stores.length}</span></div><div className="grid gap-3 md:grid-cols-2">{stores.map((store) => <StoreCard key={store.id} store={store} text={text} />)}</div></section>}
          <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">{text.productsTitle}</h2><span className="text-xs text-muted-foreground">{meta?.total ?? products.length}</span></div>{loading && products.length === 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[.78] animate-pulse rounded-2xl bg-muted" />)}</div> : products.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{products.map((product) => <SearchCard key={product.id} product={product} text={text} locale={locale} />)}</div> : <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center"><Package className="mx-auto h-9 w-9 text-muted-foreground/50" /><h3 className="mt-3 text-base font-bold">{text.noResults}</h3><p className="mt-1 text-sm text-muted-foreground">{text.noResultsText}</p></div>}{hasMore && <div ref={loader} className="flex justify-center py-8"><span className="text-xs text-muted-foreground">{text.loading}</span></div>}{!hasMore && products.length > 0 && <p className="mt-7 text-center text-xs text-muted-foreground">{text.allShown}</p>}</section>
        </>}
      </section>
    </div>
  </div></main><SiteFooter /></>;
}
