'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X, Package, ArrowUpDown, Tag, DollarSign, ChevronDown, ArrowLeft, Star, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { cn, formatPrice } from '@/lib/utils';
import { useRouter } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';

type SortOption = 'newest' | 'cheapest' | 'expensive' | 'popular';
type Locale = 'fa' | 'ps' | 'en';
interface Product { id: string; name: string; slug: string; price: number; compareAtPrice?: number | null; images?: Array<{ url: string }>; rating?: number; reviewCount?: number; category?: { name: string } }
interface SearchMeta { total: number; page: number; pageSize: number; hasMore: boolean; query: string }
interface SearchCopy { search: string; searchAria: string; sort: string; category: string; price: string; clear: string; view: string; results: string; resultsFor: string; emptyTitle: string; emptyText: string; noResults: string; noResultsText: string; allProducts: string; allCategories: string; allPrices: string; newest: string; cheapest: string; expensive: string; popular: string; clearSearch: string; wishlist: string; allShown: string; loading: string; error: string; retry: string; categories: Record<string,string>; prices: Record<string,string> }

const sortApi: Record<SortOption, string> = { newest: 'newest', cheapest: 'priceAsc', expensive: 'priceDesc', popular: 'popular' };

function FilterDropdown<T extends string>({ label, options, value, onChange }: { label: string; icon?: ComponentType<{ className?: string }>; options: Array<{ value: T; label: string }>; value: T; onChange: (value: T) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  const selected = options.find((option) => option.value === value);
  return <div ref={ref} className="relative shrink-0"><button type="button" onClick={() => setOpen((current) => !current)} className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/50" aria-expanded={open}>{selected?.label ?? label}<ChevronDown className={cn('h-3 w-3', open && 'rotate-180')} aria-hidden /></button>{open && <div className="absolute start-0 top-full z-50 mt-1.5 min-w-[170px] overflow-hidden rounded-xl border border-border bg-card shadow-lg">{options.map((option) => <button key={option.value} type="button" onClick={() => { onChange(option.value); setOpen(false); }} className={cn('flex w-full px-4 py-2.5 text-start text-xs hover:bg-muted', option.value === value && 'bg-primary/10 font-semibold text-primary')}>{option.label}</button>)}</div>}</div>;
}

function SearchCard({ product, text, locale }: { product: Product; text: SearchCopy; locale: Locale }) {
  const image = product.images?.[0]?.url;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  return <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
    {discount > 0 && <span className="absolute start-2 top-2 z-10 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">-{discount}%</span>}
    <button type="button" aria-label={text.wishlist} className="absolute end-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"><span aria-hidden>♡</span></button>
    <Link href={`/shop/${product.slug}`} className="block"><div className="relative aspect-square overflow-hidden bg-muted">{image ? <Image src={image} alt={product.name} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Package className="h-12 w-12 text-muted-foreground/30" aria-hidden /></div>}</div></Link>
    <div className="flex flex-1 flex-col gap-2 p-3">{product.category && <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{product.category.name}</p>}<h2 className="line-clamp-2 text-sm font-semibold"><Link href={`/shop/${product.slug}`}>{product.name}</Link></h2>{product.rating !== undefined && product.rating > 0 && <div className="flex items-center gap-1" aria-label={`${product.rating}/5`}>{[0,1,2,3,4].map((i) => <Star key={i} className={cn('h-2.5 w-2.5', i < Math.round(product.rating!) ? 'fill-amber-400 text-amber-400' : 'text-muted')} aria-hidden />)}{product.reviewCount ? <span className="text-[10px] text-muted-foreground">({product.reviewCount})</span> : null}</div>}<div className="mt-auto flex items-end justify-between gap-2 border-t border-border pt-2.5"><div>{discount > 0 && product.compareAtPrice && <span className="block text-[10px] text-muted-foreground line-through">{formatPrice(product.compareAtPrice, 'AFN', locale)}</span>}<span className="font-bold text-sm text-primary">{formatPrice(product.price, 'AFN', locale)}</span></div><Link href={`/shop/${product.slug}`} className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-bold text-primary-foreground">{text.view}<ArrowLeft className="h-2.5 w-2.5 icon-directional" aria-hidden /></Link></div></div>
  </article>;
}

export default function SearchPage() {
  const locale = useLocale() as Locale;
  const translate = useTranslations('searchUi');
  const text = useMemo<SearchCopy>(() => ({ search: translate('search'), searchAria: translate('searchAria'), sort: translate('sort'), category: translate('category'), price: translate('price'), clear: translate('clear'), view: translate('view'), results: translate('results'), resultsFor: translate('resultsFor'), emptyTitle: translate('emptyTitle'), emptyText: translate('emptyText'), noResults: translate('noResults'), noResultsText: translate('noResultsText'), allProducts: translate('allProducts'), allCategories: translate('allCategories'), allPrices: translate('allPrices'), newest: translate('newest'), cheapest: translate('cheapest'), expensive: translate('expensive'), popular: translate('popular'), clearSearch: translate('clearSearch'), wishlist: translate('wishlist'), allShown: translate('allShown'), loading: translate('loading'), error: translate('error'), retry: translate('retry'), categories: { clothing: translate('categories.clothing'), digital: translate('categories.digital'), homeAppliances: translate('categories.homeAppliances'), beauty: translate('categories.beauty'), sports: translate('categories.sports'), footwear: translate('categories.footwear'), baby: translate('categories.baby'), traditional: translate('categories.traditional') }, prices: { low: translate('prices.low'), mid: translate('prices.mid'), high: translate('prices.high'), top: translate('prices.top') } }), [translate]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [debounced, setDebounced] = useState(query);
  const [sort, setSort] = useState<SortOption>('newest');
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const loader = useRef<HTMLDivElement>(null);
  const categories = Object.entries(text.categories);
  const prices = Object.entries(text.prices);

  useEffect(() => { const timer = setTimeout(() => setDebounced(query), 300); return () => clearTimeout(timer); }, [query]);
  useEffect(() => { const next = searchParams.get('q') ?? ''; if (next !== query) { setQuery(next); setDebounced(next); } }, [searchParams, query]);
  const fetchProducts = useCallback(async (requestedPage: number, append: boolean) => { if (debounced.trim().length < 2) { setProducts([]); setMeta(null); setHasMore(false); return; } setLoading(true); setError(false); try { const params = new URLSearchParams({ q: debounced.trim(), page: String(requestedPage), pageSize: '12', sort: sortApi[sort] }); if (category) params.set('categoryKey', category); if (priceRange) { const [min,max] = priceRange.split('-'); if (min) params.set('priceMin', min); if (max) params.set('priceMax', max); } const response = await fetch(`/api/search?${params.toString()}`, { credentials: 'same-origin' }); const data = await response.json() as { ok?: boolean; data?: Product[]; meta?: SearchMeta }; if (!response.ok || !data.ok) throw new Error('search_failed'); setProducts((current) => append ? [...current, ...(data.data ?? [])] : (data.data ?? [])); setMeta(data.meta ?? null); setHasMore(data.meta?.hasMore ?? false); } catch { setError(true); if (!append) setProducts([]); } finally { setLoading(false); } }, [debounced, sort, category, priceRange]);
  useEffect(() => { setPage(1); fetchProducts(1, false); }, [fetchProducts]);
  useEffect(() => { const element = loader.current; if (!element) return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && hasMore && !loading) setPage((value) => value + 1); }, { rootMargin: '160px' }); observer.observe(element); return () => observer.disconnect(); }, [hasMore, loading]);
  useEffect(() => { if (page > 1) fetchProducts(page, true); }, [page, fetchProducts]);
  const sortOptions = [{ value: 'newest' as const, label: text.newest }, { value: 'cheapest' as const, label: text.cheapest }, { value: 'expensive' as const, label: text.expensive }, { value: 'popular' as const, label: text.popular }];
  const categoryOptions = [{ value: '', label: text.allCategories }, ...categories.map(([value,label]) => ({ value,label }))];
  const priceOptions = [{ value: '', label: text.allPrices }, ...prices.map(([value,label]) => ({ value,label }))];
  function clearAll() { setQuery(''); setCategory(''); setPriceRange(''); setSort('newest'); setProducts([]); setMeta(null); router.push('/search'); }
  const hasFilters = Boolean(category || priceRange || sort !== 'newest');
  return <><SiteHeader /><main id="main" className="min-h-dvh bg-background"><div className="mx-auto max-w-screen-xl px-3 py-6 sm:px-6 sm:py-10"><div className="mx-auto max-w-3xl"><div className="relative"><Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') router.push(`/search?q=${encodeURIComponent(query.trim())}`); }} placeholder={text.search} aria-label={text.searchAria} className="h-14 w-full rounded-2xl border border-border bg-card px-12 pe-12 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />{query && <button type="button" onClick={() => setQuery('')} aria-label={text.clearSearch} className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" aria-hidden /></button>}</div></div><div className="mt-5 flex flex-wrap items-center gap-2"><FilterDropdown label={text.sort} options={sortOptions} value={sort} onChange={setSort} /><FilterDropdown label={text.category} options={categoryOptions} value={category} onChange={setCategory} /><FilterDropdown label={text.price} options={priceOptions} value={priceRange} onChange={setPriceRange} />{hasFilters && <button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"><RotateCcw className="h-3.5 w-3.5" aria-hidden />{text.clear}</button>}</div>{error && <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert"><span>{text.error}</span><button type="button" onClick={() => fetchProducts(1, false)} className="inline-flex items-center gap-1 font-bold"><RotateCcw className="h-3.5 w-3.5" aria-hidden />{text.retry}</button></div>}<div className="mt-7 flex items-center justify-between"><div><h1 className="text-xl font-extrabold">{query ? `${text.resultsFor} “${query}”` : text.emptyTitle}</h1>{meta && <p className="mt-1 text-xs text-muted-foreground">{meta.total} {text.results}</p>}</div>{loading && <span className="text-xs font-semibold text-muted-foreground">{text.loading}</span>}</div>{loading && products.length === 0 ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{Array.from({length:8}).map((_,i)=><div key={i} className="aspect-[.78] animate-pulse rounded-xl bg-muted" />)}</div> : products.length > 0 ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{products.map((product) => <SearchCard key={product.id} product={product} text={text} locale={locale} />)}</div> : <div className="mt-14 rounded-3xl border border-dashed border-border px-6 py-14 text-center"><Package className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden /><h2 className="mt-4 text-lg font-bold">{query ? text.noResults : text.emptyTitle}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{query ? text.noResultsText : text.emptyText}</p>{query && <Link href="/shop" className="mt-5 inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">{text.allProducts}</Link>}</div>}{hasMore && <div ref={loader} className="mt-8 flex justify-center py-4"><span className="text-xs text-muted-foreground">{text.loading}</span></div>}{!hasMore && products.length > 0 && <p className="mt-8 text-center text-xs text-muted-foreground">{text.allShown}</p>}</div></main><SiteFooter /></>;
}
