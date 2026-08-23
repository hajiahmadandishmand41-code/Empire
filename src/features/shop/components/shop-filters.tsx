'use client';

import * as React from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ShopSort = 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'recommended';

export interface ShopFiltersValue {
  priceMin: number | '';
  priceMax: number | '';
  inStockOnly: boolean;
  hasDiscountOnly: boolean;
  minRating: number | '';
  sellerId: string;
  sort: ShopSort;
}

const SORTS: Array<{ key: ShopSort; label: string }> = [
  { key: 'recommended', label: 'پیشنهادی' },
  { key: 'newest', label: 'جدیدترین' },
  { key: 'popular', label: 'پرفروش‌ترین' },
  { key: 'price_asc', label: 'ارزان‌ترین' },
  { key: 'price_desc', label: 'گران‌ترین' },
];

interface ShopFiltersProps {
  value: ShopFiltersValue;
  onChange: (v: ShopFiltersValue) => void;
  onReset: () => void;
}

export function ShopFilters({ value, onChange, onReset }: ShopFiltersProps) {
  const [expanded, setExpanded] = React.useState(false);
  const isFiltered = value.priceMin !== '' || value.priceMax !== '' || value.inStockOnly || value.hasDiscountOnly || value.minRating !== '';

  function patch(partial: Partial<ShopFiltersValue>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="filter-sort" className="text-xs font-medium text-foreground whitespace-nowrap">مرتب‌سازی:</label>
            <select
              id="filter-sort"
              value={value.sort}
              onChange={(e) => {
                const next = e.target.value;
                if (SORTS.some((sort) => sort.key === next)) patch({ sort: next as ShopSort });
              }}
              className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground shadow-xs focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400/20"
            >
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <label className="hidden cursor-pointer items-center gap-2 text-xs font-medium text-foreground sm:flex">
            <div
              role="checkbox"
              aria-checked={value.inStockOnly}
              tabIndex={0}
              onClick={() => patch({ inStockOnly: !value.inStockOnly })}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); patch({ inStockOnly: !value.inStockOnly }); } }}
              className={cn('relative h-4.5 w-8 cursor-pointer rounded-full border-2 transition-colors', value.inStockOnly ? 'border-rose-500 bg-rose-500' : 'border-border bg-muted')}
            >
              <span className={cn('absolute top-0 block h-3 w-3 rounded-full bg-card shadow-sm transition-all', value.inStockOnly ? 'start-3.5' : 'start-0')} />
            </div>
            فقط موجود
          </label>
        </div>

        <button type="button" onClick={() => setExpanded((current) => !current)} className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600">
          <span>فیلترهای بیشتر</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border p-3.5 sm:p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="filter-price-min" className="mb-1 block text-xs text-muted-foreground">قیمت از</label>
              <input id="filter-price-min" type="number" min="0" inputMode="numeric" value={value.priceMin} onChange={(e) => patch({ priceMin: e.target.value ? Number(e.target.value) : '' })} placeholder="حداقل" dir="ltr" className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400/20" />
            </div>
            <div>
              <label htmlFor="filter-price-max" className="mb-1 block text-xs text-muted-foreground">قیمت تا</label>
              <input id="filter-price-max" type="number" min="0" inputMode="numeric" value={value.priceMax} onChange={(e) => patch({ priceMax: e.target.value ? Number(e.target.value) : '' })} placeholder="حداکثر" dir="ltr" className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400/20" />
            </div>
            <div>
              <label htmlFor="filter-rating" className="mb-1 block text-xs text-muted-foreground">حداقل امتیاز</label>
              <select id="filter-rating" value={value.minRating} onChange={(e) => patch({ minRating: e.target.value ? Number(e.target.value) : '' })} className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400/20">
                <option value="">همه امتیازها</option>
                <option value="4">۴ ستاره و بیشتر</option>
                <option value="3">۳ ستاره و بیشتر</option>
                <option value="2">۲ ستاره و بیشتر</option>
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground">
              <input type="checkbox" checked={value.hasDiscountOnly} onChange={(e) => patch({ hasDiscountOnly: e.target.checked })} className="h-4 w-4 rounded border-border text-rose-500 accent-rose-500" />
              فقط تخفیف‌دارها
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground sm:hidden">
              <input type="checkbox" checked={value.inStockOnly} onChange={(e) => patch({ inStockOnly: e.target.checked })} className="h-4 w-4 rounded border-border text-rose-500 accent-rose-500" />
              فقط موجود
            </label>
            {isFiltered && <Button type="button" variant="ghost" size="sm" onClick={onReset} className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" aria-hidden />پاک کردن فیلترها</Button>}
          </div>
        </div>
      )}
    </div>
  );
}
