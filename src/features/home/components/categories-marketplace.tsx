'use client';

import Image from 'next/image';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';

export type MarketplaceCategory = { key: string; slug: string; name: string; productCount?: number; title: string; image: string };
type Props = { categories: MarketplaceCategory[]; locale: string; placeholder?: string; allLabel: string };

export function CategoriesMarketplace({ categories, locale, allLabel }: Props) {
  const [active, setActive] = useState('all');
  const visible = useMemo(
    () => active === 'all' ? categories : categories.filter((category) => category.key === active),
    [active, categories],
  );
  const selected = categories.find((category) => category.key === active);

  const labels = locale === 'en'
    ? { main: 'Main categories', explore: 'Explore by shelf', all: 'All categories', items: 'categories', products: 'products', empty: 'No categories found', back: 'View category' }
    : locale === 'ps'
      ? { main: 'اصلي وېشنيزې', explore: 'د بازار د برخې له مخې', all: 'ټولې وېشنيزې', items: 'برخې', products: 'محصولات', empty: 'هېڅ وېشنيزه ونه موندل شوه', back: 'وېشنيزه وګورئ' }
      : { main: 'دسته‌های اصلی', explore: 'کشف بر اساس قفسه', all: 'همه دسته‌ها', items: 'دسته', products: 'محصول', empty: 'دسته‌ای پیدا نشد', back: 'مشاهده دسته' };

  return (
    <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-3 flex items-center gap-2 px-2 text-sm font-black">
            <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
            {labels.main}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar lg:block">
            <button
              type="button"
              onClick={() => setActive('all')}
              className={`mb-1 flex shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-start text-xs font-bold transition lg:w-full ${active === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
            >
              <span>{allLabel || labels.all}</span>
              <ChevronDown className="hidden h-3.5 w-3.5 lg:block" aria-hidden="true" />
            </button>
            {categories.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => setActive(category.key)}
                className={`mb-1 flex shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-start text-xs font-bold transition lg:w-full ${active === category.key ? 'bg-primary/10 text-primary ring-1 ring-primary/15' : 'hover:bg-muted'}`}
              >
                <span className="truncate">{category.title}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">{category.productCount ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-5">
        <div className="flex items-end justify-between gap-3 rounded-3xl border border-border bg-card p-4 sm:p-5">
          <div>
            <p className="text-xs font-bold text-primary">{labels.explore}</p>
            <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">{selected?.title ?? labels.all}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{visible.length} {labels.items}</p>
          </div>
          <Link href="/search" className="shrink-0 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold transition hover:border-primary/40 hover:text-primary">
            {locale === 'en' ? 'Search products' : locale === 'ps' ? 'محصولات ولټوئ' : 'جستجوی محصولات'}
          </Link>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-lg font-black">{labels.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((category) => (
              <Link
                key={category.key}
                href={`/category/${category.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <div className="relative aspect-[1.12] overflow-hidden bg-muted">
                  <Image src={category.image} alt={category.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 260px" className="object-cover transition duration-500 group-hover:scale-[1.035]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                  <div className="absolute inset-x-3 bottom-3 text-white">
                    <h3 className="line-clamp-2 text-sm font-black sm:text-base">{category.title}</h3>
                    <p className="mt-1 text-[11px] font-semibold text-white/80">{category.productCount ?? 0} {labels.products}</p>
                  </div>
                </div>
                <div className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground">{labels.back} ←</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
