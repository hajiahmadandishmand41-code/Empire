'use client';

import type { ProductSummary } from '@/types';
import { Link } from '@/i18n/routing';
import { MarketplaceProductCard } from '@/components/marketplace-product-card';

export function HomeCatalogGrid({ products, locale = 'fa', currency = 'AFN' }: { products: ProductSummary[]; locale?: string; currency?: string }) {
  const unique = Array.from(new Map(products.map((product) => [product.id, product])).values()).slice(0, 15);
  if (unique.length === 0) return null;
  const copy = locale === 'en'
    ? { title: 'More to explore', subtitle: 'A wider mix of products from across the marketplace', all: 'View all products' }
    : locale === 'ps'
      ? { title: 'نور د کشف لپاره', subtitle: 'د بازار له بېلابېلو برخو نور محصولات', all: 'ټول محصولات وګورئ' }
      : { title: 'محصولات بیشتر برای کشف', subtitle: 'ترکیبی متنوع‌تر از محصولات واقعی بازار', all: 'مشاهده همه محصولات' };
  return (
    <section className="border-y border-border bg-background py-4 sm:py-8" aria-label={copy.title}>
      <div className="mx-auto max-w-screen-2xl px-2.5 sm:px-6">
        <div className="mb-3 flex items-end justify-between gap-2 sm:mb-4 sm:gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><span className="h-6 w-1 rounded-full bg-gradient-to-b from-fuchsia-300 via-rose-300 to-sky-300" aria-hidden="true" /><h2 className="text-sm font-black tracking-tight sm:text-lg">{copy.title}</h2></div>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:mt-1 sm:text-xs sm:leading-5">{copy.subtitle}</p>
          </div>
          <Link href="/shop" className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold transition-colors hover:bg-muted sm:px-3.5 sm:py-1.5 sm:text-[11px]">{copy.all}</Link>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
          {unique.map((product) => <MarketplaceProductCard key={product.id} product={product} locale={locale} currency={currency} view="grid" />)}
        </div>
      </div>
    </section>
  );
}
