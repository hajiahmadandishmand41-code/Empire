'use client';

import Image from 'next/image';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';

export type MarketplaceCategory = { key: string; slug: string; name: string; productCount?: number; title: string; image: string };
type Props = { categories: MarketplaceCategory[]; locale: string; placeholder: string; allLabel: string };

export function CategoriesMarketplace({ categories, locale, placeholder, allLabel }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('all');
  const visible = useMemo(() => categories.filter((category) => {
    const q = query.trim().toLocaleLowerCase(locale);
    const hay = `${category.name} ${category.title}`.toLocaleLowerCase(locale);
    return (!q || hay.includes(q)) && (active === 'all' || category.key === active);
  }), [active, categories, locale, query]);
  const selected = categories.find((category) => category.key === active);

  const labels = locale === 'en'
    ? { main: 'Main categories', explore: 'Explore by shelf', all: 'All categories', items: 'categories', products: 'products', empty: 'No categories found', back: 'View category' }
    : locale === 'ps'
      ? { main: 'اصلي وېشنيزې', explore: 'د بازار د برخې له مخې', all: 'ټولې وېشنيزې', items: 'برخې', products: 'محصولات', empty: 'هېڅ وېشنيزه ونه موندل شوه', back: 'وېشنيزه وګورئ' }
      : { main: 'دسته‌های اصلی', explore: 'کشف بر اساس قفسه', all: 'همه دسته‌ها', items: 'بخش', products: 'محصول', empty: 'دسته‌ای پیدا نشد', back: 'مشاهده دسته' };

  return <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-3 flex items-center gap-2 px-2 text-sm font-black"><SlidersHorizontal className="h-4 w-4 text-primary" />{labels.main}</div>
        <div className="mb-2 flex gap-1 overflow-x-auto pb-1 no-scrollbar lg:block">
          <button type="button" onClick={() => setActive('all')} className={`shrink-0 rounded-xl px-3 py-2.5 text-start text-xs font-bold transition lg:mb-1 lg:flex lg:w-full lg:items-center lg:justify-between ${active === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><span>{allLabel}</span><ChevronDown className="hidden h-3.5 w-3.5 lg:block" /></button>
          {categories.map((category) => <button key={category.key} type="button" onClick={() => setActive(category.key)} className={`shrink-0 rounded-xl px-3 py-2.5 text-start text-xs font-bold transition lg:flex lg:w-full lg:items-center lg:justify-between ${active === category.key ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><span className="truncate">{category.title}</span><span className="ms-2 shrink-0 text-[10px] text-muted-foreground">{category.productCount ?? 0}</span></button>)}
        </div>
      </div>
    </aside>

    <div className="min-w-0 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="relative"><Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-11 w-full rounded-xl border border-border bg-muted/40 ps-10 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></div>
      </div>

      <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold text-primary">{labels.explore}</p><h2 className="mt-1 text-xl font-black">{selected?.title ?? labels.all}</h2></div><span className="text-xs text-muted-foreground">{visible.length} {labels.items}</span></div>

      {visible.length === 0 ? <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center"><p className="text-lg font-black">{labels.empty}</p></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{visible.map((category) => <Link key={category.key} href={`/category/${category.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
        <div className="relative aspect-[1.12] overflow-hidden bg-muted">
          <Image src={category.image} alt={category.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 260px" className="object-cover transition duration-500 group-hover:scale-[1.035]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
          <div className="absolute inset-x-3 bottom-3 text-white"><h3 className="line-clamp-2 text-sm font-black sm:text-base">{category.title}</h3><p className="mt-1 text-[11px] font-semibold text-white/80">{category.productCount ?? 0} {labels.products}</p></div>
        </div>
        <div className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground">{labels.back} ←</div>
      </Link>)}</div>}
    </div>
  </div>;
}
