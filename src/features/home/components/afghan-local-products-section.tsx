'use client';

import * as React from 'react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';

interface LocalCategory {
  key: string;
  name: string;
  nameEn: string;
  description: string;
  emoji: string;
  gradient: string;
  ring: string;
  href: string;
  textColor: string;
}

const afghanCategories: LocalCategory[] = [
  {
    key: 'saffron', name: 'زعفران', nameEn: 'Saffron', description: 'زعفران اصیل هرات', emoji: '🌸',
    gradient: 'from-amber-500 to-orange-600', ring: 'ring-amber-300/50', href: '/shop?q=زعفران&categoryKey=traditional', textColor: 'text-amber-700 dark:text-amber-300',
  },
  {
    key: 'carpet', name: 'قالین', nameEn: 'Carpet', description: 'قالین دستباف اصیل', emoji: '🎨',
    gradient: 'from-red-600 to-rose-700', ring: 'ring-red-300/50', href: '/shop?q=قالین&categoryKey=traditional', textColor: 'text-red-700 dark:text-red-300',
  },
  {
    key: 'driedFruits', name: 'میوه خشک', nameEn: 'Dried Fruits', description: 'کشمش، انجیر و بیشتر', emoji: '🍇',
    gradient: 'from-purple-500 to-violet-700', ring: 'ring-purple-300/50', href: '/shop?q=میوه+خشک&categoryKey=traditional', textColor: 'text-purple-700 dark:text-purple-300',
  },
  {
    key: 'handicrafts', name: 'صنایع دستی', nameEn: 'Handicrafts', description: 'هنر دستی افغانستان', emoji: '🏺',
    gradient: 'from-teal-500 to-emerald-700', ring: 'ring-teal-300/50', href: '/shop?q=صنایع+دستی&categoryKey=traditional', textColor: 'text-teal-700 dark:text-teal-300',
  },
  {
    key: 'traditionalClothing', name: 'لباس محلی', nameEn: 'Traditional Clothes', description: 'پوشاک سنتی اصیل', emoji: '👘',
    gradient: 'from-blue-500 to-indigo-700', ring: 'ring-blue-300/50', href: '/shop?q=لباس+محلی&categoryKey=clothing', textColor: 'text-blue-700 dark:text-blue-300',
  },
  {
    key: 'honey', name: 'عسل', nameEn: 'Honey', description: 'عسل طبیعی کوهستان', emoji: '🍯',
    gradient: 'from-yellow-400 to-amber-600', ring: 'ring-yellow-300/50', href: '/shop?q=عسل&categoryKey=traditional', textColor: 'text-yellow-700 dark:text-yellow-300',
  },
  {
    key: 'nuts', name: 'خشکبار', nameEn: 'Dried Nuts', description: 'بادام، پسته، چارمغز', emoji: '🥜',
    gradient: 'from-stone-500 to-amber-700', ring: 'ring-stone-300/50', href: '/shop?q=خشکبار&categoryKey=traditional', textColor: 'text-stone-700 dark:text-stone-300',
  },
  {
    key: 'gemstones', name: 'سنگ‌های قیمتی', nameEn: 'Gemstones', description: 'لاجورد، زمرد، یاقوت', emoji: '💎',
    gradient: 'from-cyan-500 to-blue-700', ring: 'ring-cyan-300/50', href: '/shop?q=سنگ+قیمتی&categoryKey=traditional', textColor: 'text-cyan-700 dark:text-cyan-300',
  },
];

export function AfghanLocalProductsSection() {
  return (
    <section aria-labelledby="afghan-local-title" className="relative overflow-hidden border-b border-border py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-background to-amber-50/60 dark:from-emerald-950/20 dark:via-background dark:to-amber-950/20" />
      <div className="pointer-events-none absolute -top-24 -end-24 h-64 w-64 rounded-full bg-emerald-200/20 blur-3xl dark:bg-emerald-800/10" />
      <div className="pointer-events-none absolute -bottom-24 -start-24 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-800/10" />

      <div className="relative mx-auto max-w-screen-xl px-3 sm:px-6">
        <div className="mb-7 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-xl shadow-md" aria-hidden>🇦🇫</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="afghan-local-title" className="text-base font-extrabold text-foreground sm:text-xl">محصولات محلی افغانستان</h2>
                <span className="hidden rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 sm:inline-flex">اصیل افغانستان</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">محصولات اصیل و باکیفیت مستقیم از تولیدکنندگان افغانستان</p>
            </div>
          </div>
          <Link href="/traditional" className="shrink-0 flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-emerald-400 hover:text-emerald-700 dark:hover:border-emerald-600 dark:hover:text-emerald-400">همه محصولات <span className="icon-directional" aria-hidden>←</span></Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-8 lg:gap-3">
          {afghanCategories.map((cat, index) => <AfghanCategoryCard key={cat.key} category={cat} index={index} />)}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 dark:border-emerald-800/40 dark:from-emerald-950/30 dark:to-teal-950/30 sm:p-5">
          <div className="flex min-w-0 items-center gap-3"><span className="text-3xl" aria-hidden>🏔️</span><div><p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">کالاهای اصیل افغانستان، مستقیم از تولیدکننده</p><p className="mt-0.5 text-xs text-emerald-700/70 dark:text-emerald-400/70">ضمانت اصالت — حمایت از تولید داخلی</p></div></div>
          <Link href="/traditional" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700">کشف کنید</Link>
        </div>
      </div>
    </section>
  );
}

function AfghanCategoryCard({ category, index }: { category: LocalCategory; index: number }) {
  return (
    <Link href={category.href} className={cn('group relative flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-3.5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-lg', `hover:ring-2 ${category.ring}`, 'sm:p-4')} style={{ animationDelay: `${index * 60}ms` }}>
      <div className={cn('flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16 sm:text-3xl', category.gradient)}>{category.emoji}</div>
      <div className="space-y-0.5"><p className="text-xs font-bold leading-tight text-foreground sm:text-sm">{category.name}</p><p className="text-[9px] leading-tight text-muted-foreground sm:text-[10px]">{category.description}</p></div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </Link>
  );
}
