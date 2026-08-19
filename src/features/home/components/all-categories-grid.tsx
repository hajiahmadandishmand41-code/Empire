'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { LucideIcon } from 'lucide-react';

type Item = { key: string; icon: LucideIcon; href: string; fa: string; ps: string; en: string };

export function AllCategoriesGrid({ items, locale, placeholder }: { items: Item[]; locale: string; placeholder: string }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.fa} ${item.ps} ${item.en}`.toLocaleLowerCase().includes(q));
  }, [items, query]);

  const label = (item: Item) => locale === 'en' ? item.en : locale === 'ps' ? item.ps : item.fa;
  const browse = locale === 'en' ? 'Browse products' : locale === 'ps' ? 'محصولات وګورئ' : 'مشاهده محصولات';
  const empty = locale === 'en' ? 'No matching category.' : locale === 'ps' ? 'کټګوري ونه موندل شوه.' : 'دسته‌ای پیدا نشد.';

  return (
    <>
      <label className="relative block w-full sm:max-w-sm">
        <span className="sr-only">{placeholder}</span>
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder={placeholder} className="h-12 w-full rounded-2xl border border-border bg-background ps-10 pe-4 text-sm outline-none transition-colors focus:border-primary" />
      </label>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {filtered.map((item) => {
          const Icon = item.icon;
          return <Link key={item.key} href={item.href as never} className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105"><Icon className="h-6 w-6" aria-hidden="true" /></div><h2 className="mt-4 text-sm font-extrabold text-foreground">{label(item)}</h2><span className="mt-1 inline-block text-[10px] text-muted-foreground">{browse}</span></Link>;
        })}
      </div>
      {filtered.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">{empty}</p>}
    </>
  );
}
