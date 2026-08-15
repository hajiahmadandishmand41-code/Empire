'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
export interface ShopCategoryOption {
  key: string;
  label: string;
  count?: number;
}

export type SortOption =
  | 'newest'
  | 'priceAsc'
  | 'priceDesc'
  | 'bestSelling'
  | 'mostViewed'
  | 'popular';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'جدیدترین',
  priceAsc: 'ارزان‌ترین',
  priceDesc: 'گران‌ترین',
  bestSelling: 'پرفروش‌ترین',
  mostViewed: 'پربازدیدترین',
  popular: 'محبوب‌ترین',
};

interface ShopToolbarProps {
  search: string;
  category: string;
  sort?: SortOption;
  resultCount: number;
  categories: ShopCategoryOption[];
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSortChange?: (v: SortOption) => void;
  onClear: () => void;
}

export function ShopToolbar({
  search,
  category,
  sort,
  resultCount,
  categories,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onClear,
}: ShopToolbarProps) {
  const t = useTranslations('shop');
  const isFiltered = search !== '' || category !== 'all';

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="h-11 w-full rounded-2xl border border-border bg-card shadow-sm ps-10 pe-10 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/15"
          aria-label={t('searchPlaceholder')}
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="پاک کردن جستجو"
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {/* Row: category pills + sort */}
      <div className="flex items-center gap-2">
        {/* Category pills */}
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {categories.map((opt) => {
            const active = opt.key === category;
            return (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onCategoryChange(opt.key)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  active
                    ? 'border-rose-500 bg-rose-500 text-white shadow-sm'
                    : 'border-border bg-card text-foreground hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-600',
                )}
              >
                <span>{opt.label}</span>
                {typeof opt.count === 'number' && (
                  <span
                    className={cn(
                      'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                      active ? 'bg-card/20 text-white' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sort dropdown */}
        {onSortChange && (
          <div className="relative shrink-0">
            <select
              value={sort ?? ''}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="مرتب‌سازی"
              className="h-9 appearance-none rounded-xl border border-border bg-card pe-7 ps-3 text-xs font-medium text-muted-foreground shadow-sm transition hover:border-rose-300 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-100"
            >
              <option value="">مرتب‌سازی</option>
              {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          </div>
        )}

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="shrink-0 h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-rose-500"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">{t('clearFilters')}</span>
          </Button>
        )}
      </div>

      {/* Result count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5 text-rose-400" aria-hidden />
        <span>{t('resultsCount', { count: resultCount })}</span>
      </div>
    </div>
  );
}
