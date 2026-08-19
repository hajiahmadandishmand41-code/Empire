'use client';

import { useMemo, useState } from 'react';
import { Search, X, Package } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { formatPrice } from '@/lib/utils';

interface StoreProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  categoryName?: string | null;
}

interface StoreProductSearchProps {
  products: StoreProduct[];
  locale: string;
}

export function StoreProductSearch({ products, locale }: StoreProductSearchProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return products;
    return products.filter((product) => `${product.name} ${product.categoryName ?? ''}`.toLocaleLowerCase().includes(normalized));
  }, [products, query]);

  return (
    <div className="space-y-5">
      <div className="relative max-w-2xl">
        <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جستجو در محصولات این فروشگاه…"
          aria-label="جستجو در محصولات این فروشگاه"
          className="h-12 w-full rounded-2xl border border-border bg-card px-11 pe-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="پاک کردن جستجو" className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Package className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-sm font-semibold">محصولی با این عبارت در این فروشگاه پیدا نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((product) => (
            <article key={product.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <Link href={`/products/${product.id}` as never}>
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width:640px) 50vw,(max-width:1024px) 25vw,20vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground/50"><Package className="h-8 w-8" /></div>
                  )}
                </div>
                <div className="space-y-1.5 p-3">
                  <p className="line-clamp-2 text-sm font-semibold leading-5">{product.name}</p>
                  {product.categoryName && <p className="truncate text-[11px] text-muted-foreground">{product.categoryName}</p>}
                  <p className="text-sm font-black text-price-current">{formatPrice(product.price, 'AFN', locale)}</p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
