'use client';

import { useMemo, useState } from 'react';
import { Search, Baby, BookOpen, Dumbbell, Home, ShoppingBag, Shirt, Smartphone, Sparkles, Watch, Zap, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { ComponentType } from 'react';

type IconKey = 'clothing' | 'digital' | 'homeAppliances' | 'beauty' | 'sports' | 'footwear' | 'baby' | 'books' | 'electronics' | 'watches';
type Item = { key: IconKey; iconKey: IconKey; href: string; fa: string; ps: string; en: string };

const icons: Record<IconKey, ComponentType<{ className?: string }>> = {
  clothing: Shirt, digital: Smartphone, homeAppliances: Home, beauty: Sparkles, sports: Dumbbell,
  footwear: ShoppingBag, baby: Baby, books: BookOpen, electronics: Zap, watches: Watch,
};

const images: Record<IconKey, string> = {
  clothing: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=82',
  digital: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=82',
  homeAppliances: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=82',
  beauty: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=900&q=82',
  sports: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=82',
  footwear: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=82',
  baby: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=82',
  books: 'https://images.unsplash.com/photo-1495446815903-7f8da24fdf2a?auto=format&fit=crop&w=900&q=82',
  electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=82',
  watches: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=82',
};

export function AllCategoriesGrid({ items, locale, placeholder }: { items: Item[]; locale: string; placeholder: string }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<IconKey | 'all'>('all');
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return items.filter((item) => (active === 'all' || item.key === active) && (!q || `${item.fa} ${item.ps} ${item.en}`.toLocaleLowerCase().includes(q)));
  }, [items, query, active]);

  const label = (item: Item) => locale === 'en' ? item.en : locale === 'ps' ? item.ps : item.fa;
  const browse = locale === 'en' ? 'Browse products' : locale === 'ps' ? 'محصولات وګورئ' : 'مشاهده محصولات';
  const all = locale === 'en' ? 'All categories' : locale === 'ps' ? 'ټولې کټګورۍ' : 'همه دسته‌ها';
  const empty = locale === 'en' ? 'No matching category.' : locale === 'ps' ? 'کټګوري ونه موندل شوه.' : 'دسته‌ای پیدا نشد.';

  return <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
    <aside className="lg:sticky lg:top-24">
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <label className="relative block">
          <span className="sr-only">{placeholder}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder={placeholder} className="h-11 w-full rounded-xl border border-border bg-background ps-9 pe-3 text-sm outline-none transition-colors focus:border-primary" />
        </label>
        <div className="mt-3 space-y-1">
          <button type="button" onClick={() => setActive('all')} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-xs font-extrabold transition-colors ${active === 'all' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}>
            <span>{all}</span><span>{items.length}</span>
          </button>
          {items.map((item) => { const Icon = icons[item.iconKey]; return <button key={item.key} type="button" onClick={() => setActive(item.key)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-xs font-semibold transition-colors ${active === item.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="flex-1 truncate">{label(item)}</span><ArrowLeft className="h-3 w-3 opacity-40 rtl:rotate-180" aria-hidden="true" /></button>; })}
        </div>
      </div>
    </aside>

    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => { const Icon = icons[item.iconKey]; return <Link key={item.key} href={item.href as never} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg">
          <div className="relative aspect-[1.35/1] overflow-hidden bg-muted">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${images[item.key]})` }} aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
              <div className="min-w-0"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md"><Icon className="h-4 w-4" aria-hidden="true" /></span><h2 className="truncate text-sm font-black sm:text-base">{label(item)}</h2></div><span className="mt-2 inline-block text-[10px] text-white/75">{browse}</span></div>
              <span className="shrink-0 rounded-xl bg-white px-3 py-2 text-[10px] font-extrabold text-primary shadow-sm">→</span>
            </div>
          </div>
        </Link>; })}
      </div>
      {filtered.length === 0 && <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">{empty}</p>}
    </div>
  </div>;
}
