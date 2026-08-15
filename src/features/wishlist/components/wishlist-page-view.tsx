'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Heart, ShoppingCart, Trash2, ExternalLink, Package, ArrowLeft, Share2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import { useWishlistStore } from '../store/wishlist-store';
import { toast } from 'sonner';

interface WishlistProduct {
  id?: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  images?: Array<{ url: string; src?: string }>;
  category?: { name: string };
  badge?: string;
  rating?: number;
  sellerWhatsapp?: string;
}

async function fetchProductBySlug(slug: string): Promise<WishlistProduct | null> {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.ok || !data?.data) return null;
    return data.data;
  } catch {
    return null;
  }
}

function SkeletonCard() {
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

function WishlistCard({
  product,
  onRemove,
  locale = 'fa',
  currency = 'AFN',
}: {
  product: WishlistProduct;
  onRemove: () => void;
  locale?: string;
  currency?: string;
}) {
  const imageUrl = product.images?.[0]?.url ?? product.images?.[0]?.src ?? null;
  const discountPct =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  function handleShare() {
    const url = `${window.location.origin}/shop/${product.slug}`;
    if (navigator.share) {
      navigator.share({ title: product.name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success('لینک کپی شد'));
    }
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-rose-200 dark:hover:border-rose-800 hover:shadow-lg hover:-translate-y-0.5">
      {/* Badge */}
      {discountPct > 0 && (
        <div className="absolute start-2.5 top-2.5 z-10">
          <span className="inline-flex items-center rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            -{discountPct}٪
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="absolute end-2 top-2 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200">
        <button
          type="button"
          aria-label="اشتراک‌گذاری"
          onClick={handleShare}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 dark:bg-gray-900/90 text-gray-500 shadow-sm hover:text-blue-500 border border-border transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="حذف از علاقه‌مندی‌ها"
          onClick={onRemove}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 dark:bg-gray-900/90 text-gray-500 shadow-sm hover:text-red-500 border border-border transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      {/* Product image */}
      <Link href={`/shop/${product.slug}`} tabIndex={-1} aria-hidden className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/30" aria-hidden />
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {product.category?.name && (
          <span className="text-[10px] font-medium text-muted-foreground">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          <Link href={`/shop/${product.slug}`} className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
            {product.name}
          </Link>
        </h3>

        {/* Price */}
        <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-border pt-2.5">
          <div>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="block text-[10px] text-muted-foreground line-through">
                {formatPrice(product.comparePrice, currency, locale)}
              </span>
            )}
            <span className={cn('text-sm font-bold', discountPct > 0 ? 'text-rose-600' : 'text-foreground')}>
              {formatPrice(product.price, currency, locale)}
            </span>
          </div>
          <Link
            href={`/shop/${product.slug}`}
            aria-label={`مشاهده — ${product.name}`}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700 transition-colors shadow-sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
            مشاهده
          </Link>
        </div>
      </div>
    </article>
  );
}

export function WishlistPageView({ locale = 'fa' }: { locale?: string }) {
  const slugs = useWishlistStore((s) => s.slugs);
  const remove = useWishlistStore((s) => s.remove);
  const clear = useWishlistStore((s) => s.clear);

  const [products, setProducts] = useState<Record<string, WishlistProduct | null>>({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadProducts = useCallback(async () => {
    if (slugs.length === 0) {
      setLoading(false);
      setProducts({});
      return;
    }
    setLoading(true);
    const results = await Promise.all(
      slugs.map(async (slug) => {
        const product = await fetchProductBySlug(slug);
        return { slug, product };
      }),
    );
    const map: Record<string, WishlistProduct | null> = {};
    results.forEach(({ slug, product }) => {
      // Fallback: create minimal product from slug if API returns nothing
      map[slug] = product ?? {
        name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        slug,
        price: 0,
      };
    });
    setProducts(map);
    setLoading(false);
  }, [slugs, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function handleRemove(slug: string) {
    remove(slug);
    toast.success('از علاقه‌مندی‌ها حذف شد');
  }

  function handleClear() {
    clear();
    toast.success('همه علاقه‌مندی‌ها حذف شدند');
  }

  /* ── Empty state ── */
  if (!loading && slugs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="relative mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-rose-50 dark:bg-rose-950/30 shadow-sm">
            <Heart className="h-12 w-12 text-rose-300 dark:text-rose-700" aria-hidden />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">لیست علاقه‌مندی‌ها خالی است</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
          محصولاتی که دوست دارید را با زدن آیکون قلب ذخیره کنید تا بعداً آسان‌تر پیدا کنید.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-rose-700 transition-colors hover:-translate-y-0.5 active:scale-95"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden />
          مشاهده فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-500 fill-rose-500" aria-hidden />
          <p className="text-sm font-medium text-foreground">
            {loading ? 'در حال بارگذاری...' : `${slugs.length} محصول ذخیره‌شده`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="بروزرسانی"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          </button>
          {slugs.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
            >
              <Trash2 className="h-3 w-3" aria-hidden />
              حذف همه
            </button>
          )}
        </div>
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: Math.min(slugs.length, 8) || 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 stagger-children">
          {slugs.map((slug) => {
            const product = products[slug];
            if (!product) return null;
            return (
              <div key={slug} className="animate-fade-in">
                <WishlistCard
                  product={product}
                  onRemove={() => handleRemove(slug)}
                  locale={locale}
                  currency="AFN"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom CTA */}
      {!loading && slugs.length > 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-3 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-foreground">دنبال محصولات بیشتر می‌گردید؟</p>
            <p className="text-xs text-muted-foreground mt-0.5">هزاران محصول اصل در انتظار شما</p>
          </div>
          <Link
            href="/shop"
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-sm shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            فروشگاه
          </Link>
        </div>
      )}
    </div>
  );
}
