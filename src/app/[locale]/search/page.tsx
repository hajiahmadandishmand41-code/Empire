'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Search, X, Package, SlidersHorizontal, ArrowUpDown, Tag, DollarSign, ChevronDown, ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import { useRouter } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';

type Locale = 'fa' | 'ps' | 'en';
type SortOption = 'newest' | 'cheapest' | 'expensive' | 'popular';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images?: Array<{ url: string }>;
  rating?: number;
  reviewCount?: number;
  category?: { name: string };
}

interface SearchMeta {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  query: string;
}

const copy = {
  fa: {
    search: 'جستجو در محصولات...', searchAria: 'جستجوی محصولات', sort: 'مرتب‌سازی', category: 'دسته‌بندی', price: 'قیمت', clear: 'حذف فیلترها', view: 'مشاهده', results: 'نتیجه', resultsFor: 'نتیجه برای', emptyTitle: 'جستجو کنید', emptyText: 'نام محصول، دسته‌بندی یا فروشگاه مورد نظرتان را وارد کنید.', noResults: 'نتیجه‌ای یافت نشد', noResultsText: 'جستجوی دیگری امتحان کنید یا با کلمات ساده‌تر جستجو کنید.', allProducts: 'مشاهده همه محصولات', allCategories: 'همه دسته‌ها', allPrices: 'همه قیمت‌ها', newest: 'جدیدترین', cheapest: 'ارزان‌ترین', expensive: 'گران‌ترین', popular: 'محبوب‌ترین', clearSearch: 'پاک کردن جستجو', wishlist: 'افزودن به علاقه‌مندی‌ها', allShown: 'همه نتایج نمایش داده شد', categories: { clothing: 'پوشاک', digital: 'دیجیتال', homeAppliances: 'لوازم خانگی', beauty: 'آرایشی و بهداشتی', sports: 'ورزشی', footwear: 'کفش', baby: 'کودک', traditional: 'محصولات سنتی' }, prices: { low: 'زیر ۵۰۰ افغانی', mid: '۵۰۰ تا ۲,۰۰۰ افغانی', high: '۲,۰۰۰ تا ۱۰,۰۰۰ افغانی', top: 'بالای ۱۰,۰۰۰ افغانی' }
  },
  ps: {
    search: 'په محصولاتو کې لټون...', searchAria: 'د محصولاتو لټون', sort: 'ترتیب', category: 'وېشنيزه', price: 'بیه', clear: 'فلټرونه پاک کړئ', view: 'کتل', results: 'پایلې', resultsFor: 'پایلې د', emptyTitle: 'لټون وکړئ', emptyText: 'د محصول، وېشنيزې یا پلورنځي نوم دننه کړئ.', noResults: 'هیڅ پایله ونه موندل شوه', noResultsText: 'بله کلمه وکاروئ یا ساده لټون وکړئ.', allProducts: 'ټول محصولات وګورئ', allCategories: 'ټولې وېشنيزې', allPrices: 'ټولې بیې', newest: 'نوي', cheapest: 'تر ټولو ارزانه', expensive: 'تر ټولو ګران', popular: 'مشهور', clearSearch: 'لټون پاک کړئ', wishlist: 'غوره توبونو ته زیاتول', allShown: 'ټولې پایلې ښکاره شوې', categories: { clothing: 'جامې', digital: 'ډیجیټل', homeAppliances: 'د کور وسایل', beauty: 'ښکلا او پاملرنه', sports: 'سپورت', footwear: 'بوټان', baby: 'ماشومان', traditional: 'دودیز محصولات' }, prices: { low: 'تر ۵۰۰ افغانۍ کم', mid: '۵۰۰ تر ۲,۰۰۰ افغانۍ', high: '۲,۰۰۰ تر ۱۰,۰۰۰ افغانۍ', top: 'له ۱۰,۰۰۰ افغانۍ پورته' }
  },
  en: {
    search: 'Search products...', searchAria: 'Search products', sort: 'Sort', category: 'Category', price: 'Price', clear: 'Clear filters', view: 'View', results: 'results', resultsFor: 'results for', emptyTitle: 'Start searching', emptyText: 'Enter a product, category, or store name.', noResults: 'No results found', noResultsText: 'Try another search or use simpler keywords.', allProducts: 'View all products', allCategories: 'All categories', allPrices: 'All prices', newest: 'Newest', cheapest: 'Lowest price', expensive: 'Highest price', popular: 'Most popular', clearSearch: 'Clear search', wishlist: 'Add to wishlist', allShown: 'All results shown', categories: { clothing: 'Clothing', digital: 'Digital', homeAppliances: 'Home appliances', beauty: 'Beauty & care', sports: 'Sports', footwear: 'Footwear', baby: 'Baby & kids', traditional: 'Traditional products' }, prices: { low: 'Under 500 AFN', mid: '500–2,000 AFN', high: '2,000–10,000 AFN', top: 'Over 10,000 AFN' }
  }
} as const;

const sortApi: Record<SortOption, string> = { newest: 'newest', cheapest: 'priceAsc', expensive: 'priceDesc', popular: 'popular' };

function FilterDropdown<T extends string>({ label, icon: Icon, options, value, onChange }: { label: string; icon: ComponentType<{ className?: string }>; options: Array<{ value: T; label: string }>; value: T; onChange: (value: T) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const selected = options.find((option) => option.value === value);
  return <div ref={ref} className="relative shrink-0">
    <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/50" aria-expanded={open}>
      <Icon className="h-3.5 w-3.5" aria-hidden />{selected?.label ?? label}<ChevronDown className={cn('h-3 w-3', open && 'rotate-180')} aria-hidden />
    </button>
    {open && <div className="absolute start-0 top-full z-50 mt-1.5 min-w-[170px] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
      {options.map((option) => <button key={option.value} type="button" onClick={() => { onChange(option.value); setOpen(false); }} className={cn('flex w-full px-4 py-2.5 text-start text-xs hover:bg-muted', option.value === value && 'bg-primary/10 font-semibold text-primary')}>{option.label}</button>)}
    </div>}
  </div>;
}

function SearchCard({ product, text, locale }: { product: Product; text: (typeof copy)[Locale]; locale: Locale }) {
  const image = product.images?.[0]?.url;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  return <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
    {discount > 0 && <span className="absolute start-2 top-2 z-10 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">-{discount}%</span>}
    <button type="button" aria-label={text.wishlist} className="absolute end-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"><span aria-hidden>♡</span></button>
    <Link href={`/shop/${product.slug}`} className="block"><div className="relative aspect-square overflow-hidden bg-muted">
      {image ? <Image src={image} alt={product.name} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Package className="h-12 w-12 text-muted-foreground/30" aria-hidden /></div>}
    </div></Link>
    <div className="flex flex-1 flex-col gap-2 p-3">
      {product.category && <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{product.category.name}</p>}
      <h2 className="line-clamp-2 text-sm font-semibold"><Link href={`/shop/${product.slug}`}>{product.name}</Link></h2>
      {product.rating !== undefined && product.rating > 0 && <div className="flex items-center gap-1" aria-label={`${product.rating}/5`}>
        {[0, 1, 2, 3, 4].map((i) => <Star key={i} className={cn('h-2.5 w-2.5', i < Math.round(product.rating!) ? 'fill-amber-400 text-amber-400' : 'text-muted')} aria-hidden />)}
        {product.reviewCount ? <span className="text-[10px] text-muted-foreground">({product.reviewCount})</span> : null}
      </div>}
      <div className="mt-auto flex items-end justify-between gap-2 border-t border-border pt-2.5">
        <div>{discount > 0 && product.compareAtPrice && <span className="block text-[10px] text-muted-foreground line-through">{formatPrice(product.compareAtPrice, 'AFN', locale)}</span>}<span className="font-bold text-sm text-primary">{formatPrice(product.price, 'AFN', locale)}</span></div>
        <Link href={`/shop/${product.slug}`} className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-bold text-primary-foreground">{text.view}<ArrowLeft className="h-2.5 w-2.5 icon-directional" aria-hidden /></Link>
      </div>
    </div>
  </article>;
}

export default function SearchPage() {
  const locale = useLocale() as Locale;
  const text = copy[locale] ?? copy.fa;
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

  useEffect(() => { const timer = setTimeout(() => setDebounced(query), 300); return () => clearTimeout(timer); }, [query]);
  useEffect(() => { const next = searchParams.get('q') ?? ''; if (next !== query) { setQuery(next); setDebounced(next); } }, [searchParams, query]);

  const fetchProducts = useCallback(async (requestedPage: number, append: boolean) => {
    if (debounced.trim().length < 2) { setProducts([]); setMeta(null); setHasMore(false); return; }
    setLoading(true); setError(false);
    try {
      const params = new URLSearchParams({ q: debounced.trim(), page: String(requestedPage), pageSize: '12', sort: sortApi[sort] });
      if (category) params.set('categoryKey', category);
      if (priceRange) { const [min, max] = priceRange.split('-'); if (min) params.set('priceMin', min); if (max) params.set('priceMax', max); }
      const response = await fetch(`/api/search?${params.toString()}`, { credentials: 'same-origin' });
      const data = await response.json() as { ok?: boolean; data?: Product[]; meta?: SearchMeta };
      if (!response.ok || !data.ok) throw new Error('search_failed');
      setProducts((current) => append ? [...current, ...(data.data ?? [])] : (data.data ?? []));
      setMeta(data.meta ?? null); setHasMore(data.meta?.hasMore ?? false);
    } catch { setError(true); if (!append) setProducts([]); }
    finally { setLoading(false); }
  }, [debounced, sort, category, priceRange]);

  useEffect(() => { setPage(1); fetchProducts(1, false); }, [fetchProducts]);
  useEffect(() => { const element = loader.current; if (!element) return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && hasMore && !loading) setPage((value) => value + 1); }, { rootMargin: '160px' }); observer.observe(element); return () => observer.disconnect(); }, [hasMore, loading]);
  useEffect(() => { if (page > 1) fetchProducts(page, true); }, [page, fetchProducts]);

  const sortOptions = [
    { value: 'newest' as const, label: text.newest }, { value: 'cheapest' as const, label: text.cheapest }, { value: 'expensive' as const, label: text.expensive }, { value: 'popular' as const, label: text.popular },
  ];
  const categoryOptions = [
    { value: '', label: text.allCategories }, ...Object.entries(text.categories).map(([value, label]) => ({ value, label })),
  ];
  const priceOptions = [
    { value: '', label: text.allPrices }, { value: '0-500', label: text.prices.low }, { value: '500-2000', label: text.prices.mid }, { value: '2000-10000', label: text.prices.high }, { value: '10000-', label: text.prices.top },
  ];
  const activeFilters = Number(sort !== 'newest') + Number(Boolean(category)) + Number(Boolean(priceRange));

  function applySuggestion(value: string) { setQuery(value); setDebounced(value); router.push(`/search?q=${encodeURIComponent(value)}` as never); }

  return <>
    <SiteHeader />
    <main id="main" className="min-h-dvh bg-background">
      <div className="sticky top-[var(--header-height,112px)] z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-screen-xl px-3 py-2.5 sm:px-6">
          <div className="flex items-center gap-2"><div className="relative flex-1"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" aria-hidden /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={text.search} aria-label={text.searchAria} dir="auto" autoFocus className="w-full rounded-xl border border-border bg-card py-2.5 ps-9 pe-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />{query && <button type="button" onClick={() => applySuggestion('')} aria-label={text.clearSearch} className="absolute end-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4" aria-hidden /></button>}</div>{meta && <span className="hidden text-xs text-muted-foreground sm:inline">{meta.total.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-AF')} {text.results}</span>}</div>
          <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar"><SlidersHorizontal className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /><FilterDropdown label={text.sort} icon={ArrowUpDown} options={sortOptions} value={sort} onChange={setSort} /><FilterDropdown label={text.category} icon={Tag} options={categoryOptions} value={category} onChange={setCategory} /><FilterDropdown label={text.price} icon={DollarSign} options={priceOptions} value={priceRange} onChange={setPriceRange} />{activeFilters > 0 && <button type="button" onClick={() => { setSort('newest'); setCategory(''); setPriceRange(''); }} className="shrink-0 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">{text.clear}</button>}</div>
        </div>
      </div>
      <div className="mx-auto max-w-screen-xl px-3 py-6 sm:px-6">
        {meta && <p className="mb-4 text-sm text-muted-foreground"><strong className="text-foreground">{meta.total.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-AF')}</strong> {text.resultsFor} «{meta.query}»</p>}
        {error && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{text.noResultsText}</div>}
        {!debounced.trim() && !loading && !error && <div className="py-20 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-3xl">⌕</div><h1 className="mb-2 text-xl font-bold">{text.emptyTitle}</h1><p className="mx-auto max-w-md text-sm text-muted-foreground">{text.emptyText}</p><div className="mt-6 flex flex-wrap justify-center gap-2">{(locale === 'en' ? ['Saffron', 'Carpet', 'Phone', 'Clothing', 'Honey'] : locale === 'ps' ? ['زعفران', 'قالین', 'موبایل', 'جامې', 'شات'] : ['زعفران', 'قالین', 'موبایل', 'پوشاک', 'عسل']).map((item) => <button key={item} type="button" onClick={() => applySuggestion(item)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary">{item}</button>)}</div></div>}
        {!loading && debounced.trim() && products.length === 0 && !error && <div className="py-20 text-center"><Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" aria-hidden /><h2 className="mb-2 text-xl font-bold">{text.noResults}</h2><p className="mx-auto max-w-md text-sm text-muted-foreground">{text.noResultsText}</p><Link href="/shop" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">{text.allProducts}</Link></div>}
        {(products.length > 0 || loading) && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{products.map((product) => <SearchCard key={product.id} product={product} text={text} locale={locale} />)}{loading && products.length === 0 && Array.from({ length: 10 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />)}</div>}
        <div ref={loader} className="flex min-h-12 items-center justify-center py-4">{loading && products.length > 0 && <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />}{!hasMore && products.length > 0 && !loading && <p className="text-sm text-muted-foreground">{text.allShown}</p>}</div>
      </div>
    </main>
    <SiteFooter />
  </>;
}
