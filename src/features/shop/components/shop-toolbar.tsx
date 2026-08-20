'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';
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
  onSearchChange: _onSearchChange,
  onCategoryChange,
  onSortChange,
  onClear,
}: ShopToolbarProps) {
  const t = useTranslations('shop');
  const isFiltered = search !== '' || category !== 'all';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar" role="tablist" aria-label="دسته‌بندی محصولات">
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
                  <span className={cn('inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold', active ? 'bg-card/20 text-white' : 'bg-muted text-muted-foreground')}>
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

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
            className="h-7 shrink-0 gap-1.5 px-2 text-xs text-muted-foreground hover:text-rose-500"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">{t('clearFilters')}</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5 text-rose-400" aria-hidden />
        <span>{t('resultsCount', { count: resultCount })}</span>
      </div>
    </div>
  );
}
