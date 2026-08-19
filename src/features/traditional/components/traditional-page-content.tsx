'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn, formatPrice } from '@/lib/utils';
import { Package, ShoppingCart, Star, Loader2, Heart } from 'lucide-react';
import { useWishlistStore } from '@/features/wishlist';

const CATEGORY_KEYS = ['all', 'carpet', 'saffron', 'driedFruits', 'handicrafts', 'localClothing', 'honey', 'nuts', 'gemstones', 'traditional'] as const;
const CATEGORY_EMOJI: Record<(typeof CATEGORY_KEYS)[number], string> = { all: '🇦🇫', carpet: '🎨', saffron: '🌸', driedFruits: '🍇', handicrafts: '🏺', localClothing: '👘', honey: '🍯', nuts: '🥜', gemstones: '💎', traditional: '✨' };
interface Product { id: string; name: string; slug: string; price: number; comparePrice?: number | null; images?: Array<{ url?: string; src?: string }>; rating?: number; category?: { name: string }; videoUrl?: string | null; }
const PAGE_SIZE = 12;

async function fetchProducts(categoryKey: string, page: number): Promise<Product[]> {
  try {
    const params = new URLSearchParams({ page: String(page + 1), pageSize: String(PAGE_SIZE), isTraditional: 'true' });
    if (categoryKey !== 'all') params.set('categoryKey', categoryKey);
    const response = await fetch(`/api/products?${params.toString()}`, { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return data?.ok && Array.isArray(data?.data) ? data.data : [];
  } catch { return []; }
}

function ProductSkeleton() { return <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><div className="aspect-square bg-muted" /><div className="space-y-2.5 p-3"><div className="h-2.5 w-16 rounded bg-muted" /><div className="h-3.5 w-full rounded bg-muted" /><div className="h-3 w-3/4 rounded bg-muted" /><div className="mt-2 flex items-center justify-between border-t border-border pt-2.5"><div className="h-4 w-16 rounded bg-muted" /><div className="h-9 w-20 rounded-md bg-muted" /></div></div></div>; }

function TraditionalProductCard({ product, currency, labels }: { product: Product; currency: string; labels: { discount: string; video: string; removeWishlist: string; addWishlist: string; buy: string } }) {
  const imageUrl = product.images?.[0]?.url ?? product.images?.[0]?.src ?? null;
  const toggle = useWishlistStore((state) => state.toggle);
  const isWishlisted = useWishlistStore((state) => state.slugs.includes(product.slug));
  const discountPct = product.comparePrice && product.comparePrice > product.price ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  return <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-primary/25 hover:shadow-md">
    <Link href={`/shop/${product.slug}` as never} className="relative block aspect-square overflow-hidden bg-muted/40">
      {imageUrl ? <Image src={imageUrl} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw" /> : <div className="flex h-full w-full items-center justify-center bg-muted"><Package className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" /></div>}
      <div className="absolute start-2 top-2 flex flex-col gap-1">{discountPct > 0 && <span className="rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground shadow-sm">{discountPct}{labels.discount}</span>}{product.videoUrl && <span className="rounded-md bg-foreground/80 px-1.5 py-0.5 text-[10px] font-bold text-background shadow-sm backdrop-blur-sm">▶ {labels.video}</span>}</div>
      <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggle(product.slug); }} className="absolute end-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-background" aria-label={isWishlisted ? labels.removeWishlist : labels.addWishlist}><Heart className={cn('h-4 w-4 transition-colors', isWishlisted ? 'fill-destructive text-destructive' : 'text-muted-foreground')} aria-hidden="true" /></button>
    </Link>
    <div className="flex min-h-[9.5rem] flex-col gap-1.5 p-3"><Link href={`/shop/${product.slug}` as never} className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-foreground transition-colors hover:text-primary">{product.name}</Link>{product.category && <span className="truncate text-[10px] font-medium uppercase tracking-wide text-primary">{product.category.name}</span>}<div className="min-h-4">{product.rating !== undefined && <div className="flex items-center gap-1" aria-label={product.rating.toFixed(1)}><Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" /><span className="text-xs text-muted-foreground">{product.rating.toFixed(1)}</span></div>}</div><div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5"><div className="min-w-0">{product.comparePrice && product.comparePrice > product.price && <span className="block truncate text-[10px] text-muted-foreground line-through">{formatPrice(product.comparePrice, currency, 'fa')}</span>}<span className="block truncate text-sm font-extrabold text-foreground">{formatPrice(product.price, currency, 'fa')}</span></div><Link href={`/shop/${product.slug}` as never} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"><ShoppingCart className="h-3 w-3" aria-hidden="true" />{labels.buy}</Link></div></div>
  </article>;
}

export function TraditionalPageContent() {
  const t = useTranslations('traditional');
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORY_KEYS)[number]>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const loadProducts = useCallback(async (categoryKey: string, pageIndex: number, reset = false) => { setLoading(true); try { const newProducts = await fetchProducts(categoryKey, pageIndex); setProducts((previous) => reset ? newProducts : [...previous, ...newProducts]); setHasMore(newProducts.length === PAGE_SIZE); } finally { setLoading(false); } }, []);
  useEffect(() => { setPage(0); setProducts([]); setHasMore(true); void loadProducts(activeCategory, 0, true); }, [activeCategory, loadProducts]);
  useEffect(() => { const element = loaderRef.current; if (!element) return; const observer = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting && !loading && hasMore && products.length > 0) { const nextPage = page + 1; setPage(nextPage); void loadProducts(activeCategory, nextPage); } }, { rootMargin: '200px' }); observer.observe(element); return () => observer.disconnect(); }, [loading, hasMore, products.length, page, activeCategory, loadProducts]);
  const labels = { discount: t('discount'), video: t('video'), removeWishlist: t('removeWishlist'), addWishlist: t('addWishlist'), buy: t('buy') };

  return <div className="min-h-dvh">
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 py-9 sm:py-12" aria-labelledby="traditional-title"><div className="relative mx-auto max-w-7xl px-4 text-center"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-white/20 backdrop-blur-sm">{t('badge')}</div><h1 id="traditional-title" className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">{t('title')}</h1><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-emerald-200 sm:text-base">{t('subtitle')}</p></div></section>
    <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md"><div className="mx-auto max-w-7xl px-4"><div className="no-scrollbar flex gap-2 overflow-x-auto py-3" role="tablist" aria-label={t('title')}>{CATEGORY_KEYS.map((key) => <button key={key} type="button" role="tab" aria-selected={activeCategory === key} onClick={() => setActiveCategory(key)} className={cn('inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-bold transition-colors', activeCategory === key ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground')}><span aria-hidden="true" className="shrink-0">{CATEGORY_EMOJI[key]}</span>{t(`categories.${key}`)}</button>)}</div></div></div>
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      {!loading && products.length === 0 && <div className="flex flex-col items-center gap-3 py-16 text-center"><div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60" aria-hidden="true"><Package className="h-10 w-10 text-muted-foreground/40" /></div><p className="text-sm font-medium text-foreground">{t('emptyTitle')}</p><p className="max-w-sm text-xs leading-5 text-muted-foreground">{t('emptyDescription')}</p><button type="button" onClick={() => setActiveCategory('all')} className="mt-2 inline-flex min-h-10 items-center rounded-md bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">{t('showAll')}</button></div>}
      {products.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">{products.map((product) => <TraditionalProductCard key={product.id} product={product} currency="AFN" labels={labels} />)}</div>}
      {loading && products.length === 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5" aria-busy="true">{Array.from({ length: 8 }).map((_, index) => <ProductSkeleton key={index} />)}</div>}
      <div ref={loaderRef} className="flex justify-center py-8" aria-live="polite">{loading && products.length > 0 && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="text-sm">{t('loading')}</span></div>}{!loading && !hasMore && products.length > 0 && <p className="py-2 text-center text-xs text-muted-foreground">{t('endOfList')}</p>}</div>
    </div>
  </div>;
}
