'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import {
  Package, ShoppingCart, Star, Tag, Filter, ChevronLeft,
  Heart, Share2, Loader2, AlertCircle,
} from 'lucide-react';
import { useWishlistStore } from '@/features/wishlist';
import { toast } from 'sonner';

/* ── Category definitions ── */
const CATEGORIES = [
  { key: 'all', name: 'همه', emoji: '🇦🇫', gradient: 'from-emerald-600 to-teal-700', ring: 'ring-emerald-300/50' },
  { key: 'carpet', name: 'قالین', emoji: '🎨', gradient: 'from-red-600 to-rose-700', ring: 'ring-red-300/50' },
  { key: 'saffron', name: 'زعفران', emoji: '🌸', gradient: 'from-amber-500 to-orange-600', ring: 'ring-amber-300/50' },
  { key: 'driedFruits', name: 'میوه خشک', emoji: '🍇', gradient: 'from-purple-500 to-violet-700', ring: 'ring-purple-300/50' },
  { key: 'handicrafts', name: 'صنایع دستی', emoji: '🏺', gradient: 'from-teal-500 to-emerald-700', ring: 'ring-teal-300/50' },
  { key: 'localClothing', name: 'لباس محلی', emoji: '👘', gradient: 'from-blue-500 to-indigo-700', ring: 'ring-blue-300/50' },
  { key: 'honey', name: 'عسل', emoji: '🍯', gradient: 'from-yellow-400 to-amber-600', ring: 'ring-yellow-300/50' },
  { key: 'nuts', name: 'خشکبار', emoji: '🥜', gradient: 'from-stone-500 to-amber-700', ring: 'ring-stone-300/50' },
  { key: 'gemstones', name: 'سنگ قیمتی', emoji: '💎', gradient: 'from-cyan-500 to-blue-700', ring: 'ring-cyan-300/50' },
  { key: 'traditional', name: 'سایر', emoji: '✨', gradient: 'from-pink-500 to-rose-600', ring: 'ring-pink-300/50' },
];

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  images?: Array<{ url?: string; src?: string }>;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  category?: { name: string };
  sellerWhatsapp?: string;
  videoUrl?: string | null;
}

const PAGE_SIZE = 12;

async function fetchProducts(categoryKey: string, page: number): Promise<Product[]> {
  try {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
      isTraditional: 'true',
      ...(categoryKey !== 'all' ? { categoryKey } : {}),
    });
    const res = await fetch(`/api/products?${params}`, { credentials: 'same-origin' });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data?.data)) return [];
    return data.data;
  } catch {
    return [];
  }
}

function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 w-16 rounded bg-muted" />
        <div className="h-3.5 w-full rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="flex items-center justify-between border-t border-border pt-2.5 mt-2">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-8 w-20 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

function TraditionalProductCard({
  product,
  locale = 'fa',
  currency = 'AFN',
}: {
  product: Product;
  locale?: string;
  currency?: string;
}) {
  const imageUrl = product.images?.[0]?.url ?? product.images?.[0]?.src ?? null;
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.slugs.includes(product.slug));
  const discountPct =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-200">
      {/* Image */}
      <Link href={`/${locale}/shop/${product.slug}`} className="relative block aspect-square overflow-hidden bg-muted/40">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/30 dark:to-teal-900/30">
            <Package className="h-12 w-12 text-emerald-400/50" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 start-2 flex flex-col gap-1">
          {discountPct > 0 && (
            <span className="rounded-lg bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              {discountPct}٪ تخفیف
            </span>
          )}
          {product.videoUrl && (
            <span className="flex items-center gap-0.5 rounded-lg bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
              ▶ ویدیو
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); toggle(product.slug); }}
          className="absolute top-2 end-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:scale-110 dark:bg-black/70"
          aria-label={isWishlisted ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
        >
          <Heart
            className={cn('h-3.5 w-3.5 transition-colors', isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground')}
          />
        </button>
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3">
        {product.category && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            {product.category.name}
          </span>
        )}
        <Link href={`/${locale}/shop/${product.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:text-emerald-700 transition-colors">
          {product.name}
        </Link>

        {product.rating && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-muted-foreground">{product.rating.toFixed(1)}</span>
          </div>
        )}

        <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
          <div className="flex flex-col">
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-[10px] text-muted-foreground line-through">
                {formatPrice(product.comparePrice, currency, locale)}
              </span>
            )}
            <span className="text-sm font-extrabold text-foreground">
              {formatPrice(product.price, currency, locale)}
            </span>
          </div>

          <Link
            href={`/${locale}/shop/${product.slug}`}
            className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <ShoppingCart className="h-3 w-3" aria-hidden />
            خرید
          </Link>
        </div>
      </div>
    </div>
  );
}

export function TraditionalPageContent({ locale = 'fa' }: { locale?: string }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadProducts = useCallback(async (cat: string, pg: number, reset = false) => {
    setLoading(true);
    try {
      const newProducts = await fetchProducts(cat, pg);
      setProducts(prev => reset ? newProducts : [...prev, ...newProducts]);
      setHasMore(newProducts.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset when category changes
  useEffect(() => {
    setPage(0);
    setProducts([]);
    setHasMore(true);
    void loadProducts(activeCategory, 0, true);
  }, [activeCategory]);

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && hasMore && products.length > 0) {
          const next = page + 1;
          setPage(next);
          void loadProducts(activeCategory, next);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, hasMore, products.length, page, activeCategory, loadProducts]);

  return (
    <div className="min-h-dvh">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 py-10 sm:py-14">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-400/30 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-teal-400/20 via-transparent to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-white/20 backdrop-blur-sm">
              🇦🇫 محصولات اصیل افغانستان
            </div>
            <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
              محصولات سنتی افغانستان
            </h1>
            <p className="mt-3 text-base text-emerald-200 sm:text-lg">
              صنایع دستی اصیل، زعفران، قالین و بیشتر — مستقیم از تولیدکننده
            </p>
          </div>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto py-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200',
                  activeCategory === cat.key
                    ? `bg-gradient-to-br ${cat.gradient} text-white shadow-sm scale-105`
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
              >
                <span className="text-base">{cat.emoji}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Empty state */}
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/60">
              <Package className="h-10 w-10 text-muted-foreground/40" aria-hidden />
            </div>
            <p className="text-sm font-medium text-foreground">محصولی یافت نشد</p>
            <p className="text-xs text-muted-foreground">
              در این دسته‌بندی محصول سنتی ثبت‌شده‌ای موجود نیست
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className="mt-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              مشاهده همه
            </button>
          </div>
        )}

        {/* Product grid */}
        {products.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((product) => (
              <TraditionalProductCard key={product.id} product={product} locale={locale} currency="AFN" />
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && products.length === 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        )}

        {/* Infinite scroll loader */}
        <div ref={loaderRef} className="flex justify-center py-8">
          {loading && products.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              <span className="text-sm">در حال بارگذاری...</span>
            </div>
          )}
          {!loading && !hasMore && products.length > 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">همه محصولات نمایش داده شدند</p>
          )}
        </div>
      </div>
    </div>
  );
}
