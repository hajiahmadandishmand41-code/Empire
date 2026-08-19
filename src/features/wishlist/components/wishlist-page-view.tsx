'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Heart, ShoppingCart, Trash2, ExternalLink, Package, RefreshCw, Share2 } from 'lucide-react';
import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import { useWishlistStore } from '../store/wishlist-store';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';

interface WishlistProduct {
  id?: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  images?: Array<{ url: string; src?: string }>;
  category?: { name: string };
}

const COPY = {
  fa: { loading: 'در حال بارگذاری...', saved: 'محصول ذخیره‌شده', empty: 'لیست علاقه‌مندی‌ها خالی است', emptyHint: 'محصولاتی که دوست دارید را با زدن آیکون قلب ذخیره کنید تا بعداً آسان‌تر پیدا کنید.', browse: 'مشاهده فروشگاه', refresh: 'بروزرسانی', removeAll: 'حذف همه', removed: 'از علاقه‌مندی‌ها حذف شد', cleared: 'همه علاقه‌مندی‌ها حذف شدند', share: 'اشتراک‌گذاری', shareCopied: 'لینک کپی شد', view: 'مشاهده', more: 'دنبال محصولات بیشتر می‌گردید؟', moreHint: 'هزاران محصول در Eshop منتظر شماست', store: 'فروشگاه' },
  ps: { loading: 'په بارولو...', saved: 'ساتل شوی محصول', empty: 'ستاسو د خوښو محصولاتو لېست تش دی', emptyHint: 'هغه محصولات چې خوښوئ د زړه له نښې سره وساتئ، څو وروسته یې ژر ومومئ.', browse: 'پلورنځي وګورئ', refresh: 'تازه کول', removeAll: 'ټول حذف', removed: 'له خوښو شوو څخه لرې شو', cleared: 'ټول خوښ شوي محصولات حذف شول', share: 'شریکول', shareCopied: 'لینک کاپي شو', view: 'لیدل', more: 'نور محصولات غواړئ؟', moreHint: 'زرګونه محصولات په Eshop کې ستاسو په تمه دي', store: 'پلورنځی' },
  en: { loading: 'Loading...', saved: 'saved product', empty: 'Your wishlist is empty', emptyHint: 'Save products with the heart icon so you can find them quickly later.', browse: 'Browse the store', refresh: 'Refresh', removeAll: 'Clear all', removed: 'Removed from wishlist', cleared: 'All wishlist items removed', share: 'Share', shareCopied: 'Link copied', view: 'View', more: 'Looking for more products?', moreHint: 'Thousands of products are waiting for you on Eshop', store: 'Store' },
} as const;

async function fetchProductBySlug(slug: string): Promise<WishlistProduct | null> {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, { credentials: 'same-origin' });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ok && data?.data ? data.data : null;
  } catch {
    return null;
  }
}

function SkeletonCard() {
  return <div className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card"><div className="aspect-square bg-muted" /><div className="space-y-2 p-3"><div className="h-2.5 w-16 rounded bg-muted" /><div className="h-3.5 w-full rounded bg-muted" /><div className="h-3 w-3/4 rounded bg-muted" /><div className="mt-2 flex items-center justify-between border-t border-border pt-2.5"><div className="h-4 w-16 rounded bg-muted" /><div className="h-8 w-20 rounded-xl bg-muted" /></div></div></div>;
}

function WishlistCard({ product, onRemove, locale, currency = 'AFN' }: { product: WishlistProduct; onRemove: () => void; locale: string; currency?: string }) {
  const t = COPY[locale as keyof typeof COPY] ?? COPY.fa;
  const imageUrl = product.images?.[0]?.url ?? product.images?.[0]?.src ?? null;
  const discountPct = product.comparePrice && product.comparePrice > product.price ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;

  async function handleShare() {
    const url = `${window.location.origin}/${locale}/products/${product.id ?? product.slug}`;
    if (navigator.share) navigator.share({ title: product.name, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); toast.success(t.shareCopied); }
  }

  return <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg">
    {discountPct > 0 && <div className="absolute start-2.5 top-2.5 z-10 rounded-lg bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow">-{discountPct}%</div>}
    <div className="absolute end-2 top-2 z-10 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <button type="button" aria-label={t.share} onClick={handleShare} className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white/90 text-gray-500 shadow-sm transition-colors hover:text-primary dark:bg-gray-900/90"><Share2 className="h-3.5 w-3.5" aria-hidden /></button>
      <button type="button" aria-label={t.removeAll} onClick={onRemove} className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white/90 text-gray-500 shadow-sm transition-colors hover:text-red-500 dark:bg-gray-900/90"><Trash2 className="h-3.5 w-3.5" aria-hidden /></button>
    </div>
    <Link href={`/products/${product.id ?? product.slug}`} className="block">
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {imageUrl ? <Image src={imageUrl} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" /> : <div className="flex h-full items-center justify-center"><Package className="h-12 w-12 text-muted-foreground/30" aria-hidden /></div>}
      </div>
    </Link>
    <div className="flex flex-1 flex-col gap-2 p-3">
      {product.category?.name && <span className="text-[10px] font-medium text-muted-foreground">{product.category.name}</span>}
      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground"><Link href={`/products/${product.id ?? product.slug}`} className="transition-colors hover:text-primary">{product.name}</Link></h3>
      <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-border pt-2.5"><div>{product.comparePrice && product.comparePrice > product.price && <span className="block text-[10px] text-muted-foreground line-through">{formatPrice(product.comparePrice, currency, locale)}</span>}<span className={cn('text-sm font-bold', discountPct > 0 ? 'text-price-current' : 'text-foreground')}>{formatPrice(product.price, currency, locale)}</span></div><Link href={`/products/${product.id ?? product.slug}`} aria-label={`${t.view} — ${product.name}`} className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-sm transition-colors hover:opacity-90"><ShoppingCart className="h-3.5 w-3.5" aria-hidden />{t.view}</Link></div>
    </div>
  </article>;
}

export function WishlistPageView({ locale = 'fa' }: { locale?: string }) {
  const t = COPY[locale as keyof typeof COPY] ?? COPY.fa;
  const slugs = useWishlistStore((s) => s.slugs);
  const remove = useWishlistStore((s) => s.remove);
  const clear = useWishlistStore((s) => s.clear);
  const [products, setProducts] = useState<Record<string, WishlistProduct | null>>({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadProducts = useCallback(async () => {
    if (slugs.length === 0) { setLoading(false); setProducts({}); return; }
    setLoading(true);
    const results = await Promise.all(slugs.map(async (slug) => ({ slug, product: await fetchProductBySlug(slug) })));
    setProducts(Object.fromEntries(results.map(({ slug, product }) => [slug, product ?? { name: slug.replace(/-/g, ' '), slug, price: 0 }])));
    setLoading(false);
  }, [slugs, refreshKey]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  function handleRemove(slug: string) { remove(slug); toast.success(t.removed); }
  function handleClear() { clear(); toast.success(t.cleared); }

  if (!loading && slugs.length === 0) return <div className="flex flex-col items-center justify-center py-24 text-center"><div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-accent"><Heart className="h-12 w-12 text-primary/45" aria-hidden /></div><h2 className="mb-2 text-xl font-bold text-foreground">{t.empty}</h2><p className="mb-8 max-w-xs text-sm leading-relaxed text-muted-foreground">{t.emptyHint}</p><Link href="/shop" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:opacity-90"><ShoppingCart className="h-4 w-4" aria-hidden />{t.browse}</Link></div>;

  return <div>
    <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Heart className="h-4 w-4 fill-primary text-primary" aria-hidden /><p className="text-sm font-medium text-foreground">{loading ? t.loading : `${slugs.length} ${t.saved}`}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted/60" aria-label={t.refresh}><RefreshCw className="h-3.5 w-3.5" aria-hidden /></button>{slugs.length > 0 && <button type="button" onClick={handleClear} className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-800/60 dark:bg-red-950/20 dark:text-red-400"><Trash2 className="h-3 w-3" aria-hidden />{t.removeAll}</button>}</div></div>
    {loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{Array.from({ length: Math.min(slugs.length, 8) || 4 }).map((_, index) => <SkeletonCard key={index} />)}</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{slugs.map((slug) => { const product = products[slug]; return product ? <WishlistCard key={slug} product={product} onRemove={() => handleRemove(slug)} locale={locale} /> : null; })}</div>}
    {!loading && slugs.length > 0 && <div className="mt-8 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"><div><p className="text-sm font-semibold text-foreground">{t.more}</p><p className="mt-0.5 text-xs text-muted-foreground">{t.moreHint}</p></div><Link href="/shop" className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"><ExternalLink className="h-3.5 w-3.5" aria-hidden />{t.store}</Link></div>}
  </div>;
}
