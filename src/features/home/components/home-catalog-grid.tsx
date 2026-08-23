'use client';

import type { ProductSummary } from '@/types';
import { MarketplaceProductCard } from '@/components/marketplace-product-card';

export function HomeCatalogGrid({ products, locale = 'fa', currency = 'AFN' }: { products: ProductSummary[]; locale?: string; currency?: string }) {
  const unique = Array.from(new Map(products.map((product) => [product.id, product])).values()).slice(0, 12);
  if (unique.length === 0) return null;

  const copy = locale === 'en'
    ? { title: 'More to explore', subtitle: 'A wider mix of products from across the marketplace', all: 'View all products' }
    : locale === 'ps'
      ? { title: 'نور د کشف لپاره', subtitle: 'د بازار له بېلابېلو برخو نور محصولات', all: 'ټول محصولات وګورئ' }
      : { title: 'محصولات بیشتر برای کشف', subtitle: 'ترکیبی متنوع‌تر از محصولات واقعی بازار', all: 'مشاهده همه محصولات' };

  return (
    <section className="border-y border-border bg-background py-6 sm:py-8" aria-label={copy.title}>
      <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-7 w-1 rounded-full bg-gradient-to-b from-fuchsia-400 via-rose-400 to-sky-400" aria-hidden="true" />
              <h2 className="text-base font-black tracking-tight sm:text-lg">{copy.title}</h2>
            </div>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground sm:text-xs">{copy.subtitle}</p>
          </div>
          <a href={locale === 'en' ? '/en/shop' : locale === 'ps' ? '/ps/shop' : '/fa/shop'} className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-bold transition-colors hover:bg-muted sm:text-[11px]">{copy.all}</a>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
          {unique.map((product) => (
            <MarketplaceProductCard key={product.id} product={product} locale={locale} currency={currency} view="grid" />
          ))}
        </div>
      </div>
    </section>
  );
}
