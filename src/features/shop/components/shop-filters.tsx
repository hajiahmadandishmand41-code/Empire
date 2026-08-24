'use client';

import * as React from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ShopSort = 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'recommended';
export interface ShopOption { key: string; label: string; count?: number; }
export interface ShopFiltersValue {
  subcategoryKey: string;
  sellerId: string;
  badge: string;
  priceMin: number | '';
  priceMax: number | '';
  inStockOnly: boolean;
  hasDiscountOnly: boolean;
  minRating: number | '';
  sort: ShopSort;
}

const SORTS: Array<{ key: ShopSort; label: string }> = [
  { key: 'recommended', label: 'پیشنهادی' }, { key: 'newest', label: 'جدیدترین' },
  { key: 'popular', label: 'پرفروش‌ترین' }, { key: 'price_asc', label: 'ارزان‌ترین' }, { key: 'price_desc', label: 'گران‌ترین' },
];
interface ShopFiltersProps { value: ShopFiltersValue; onChange: (v: ShopFiltersValue) => void; onReset: () => void; subcategories?: ShopOption[]; sellers?: ShopOption[]; }

export function ShopFilters({ value, onChange, onReset, subcategories = [], sellers = [] }: ShopFiltersProps) {
  const [expanded, setExpanded] = React.useState(false);
  const isFiltered = value.subcategoryKey !== '' || value.sellerId !== '' || value.badge !== '' || value.priceMin !== '' || value.priceMax !== '' || value.inStockOnly || value.hasDiscountOnly || value.minRating !== '';
  const patch = (partial: Partial<ShopFiltersValue>) => onChange({ ...value, ...partial });
  return <div className="rounded-2xl border border-border bg-card shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2"><label htmlFor="filter-sort" className="whitespace-nowrap text-xs font-medium">مرتب‌سازی:</label><select id="filter-sort" value={value.sort} onChange={(e) => patch({ sort: e.target.value as ShopSort })} className="h-8 rounded-lg border border-border bg-background px-2 text-xs">{SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
        <label className="hidden items-center gap-2 text-xs font-medium sm:flex"><input type="checkbox" checked={value.inStockOnly} onChange={(e) => patch({ inStockOnly: e.target.checked })} className="h-4 w-4 rounded border-border accent-rose-500" /> فقط موجود</label>
        {value.subcategoryKey ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">زیر‌دسته فعال</span> : null}
      </div>
      <button type="button" onClick={() => setExpanded((current) => !current)} className="flex items-center gap-1.5 text-xs font-medium text-primary"><span>فیلترهای بیشتر</span>{expanded ? <ChevronUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}</button>
    </div>
    {expanded && <div className="border-t border-border p-3.5 sm:p-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div><label htmlFor="filter-subcategory" className="mb-1 block text-xs text-muted-foreground">زیر‌دسته</label><select id="filter-subcategory" value={value.subcategoryKey} onChange={(e) => patch({ subcategoryKey: e.target.value })} className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs"><option value="">همه زیر‌دسته‌ها</option>{subcategories.map((s) => <option key={s.key} value={s.key}>{s.label}{typeof s.count === 'number' ? ` (${s.count})` : ''}</option>)}</select></div>
      <div><label htmlFor="filter-seller" className="mb-1 block text-xs text-muted-foreground">فروشنده</label><select id="filter-seller" value={value.sellerId} onChange={(e) => patch({ sellerId: e.target.value })} className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs"><option value="">همه فروشندگان</option>{sellers.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
      <div><label htmlFor="filter-badge" className="mb-1 block text-xs text-muted-foreground">نشان محصول</label><select id="filter-badge" value={value.badge} onChange={(e) => patch({ badge: e.target.value })} className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs"><option value="">همه</option><option value="new">جدید</option><option value="best">پرفروش</option><option value="last">آخرین موجودی</option><option value="sale">فروش ویژه</option></select></div>
      <div><label htmlFor="filter-rating" className="mb-1 block text-xs text-muted-foreground">حداقل امتیاز</label><select id="filter-rating" value={value.minRating} onChange={(e) => patch({ minRating: e.target.value ? Number(e.target.value) : '' })} className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs"><option value="">همه امتیازها</option><option value="4">۴ ستاره و بیشتر</option><option value="3">۳ ستاره و بیشتر</option><option value="2">۲ ستاره و بیشتر</option></select></div>
      <div><label htmlFor="filter-price-min" className="mb-1 block text-xs text-muted-foreground">قیمت از</label><input id="filter-price-min" type="number" min="0" inputMode="numeric" value={value.priceMin} onChange={(e) => patch({ priceMin: e.target.value ? Number(e.target.value) : '' })} placeholder="حداقل" dir="ltr" className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs" /></div>
      <div><label htmlFor="filter-price-max" className="mb-1 block text-xs text-muted-foreground">قیمت تا</label><input id="filter-price-max" type="number" min="0" inputMode="numeric" value={value.priceMax} onChange={(e) => patch({ priceMax: e.target.value ? Number(e.target.value) : '' })} placeholder="حداکثر" dir="ltr" className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs" /></div>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium"><input type="checkbox" checked={value.hasDiscountOnly} onChange={(e) => patch({ hasDiscountOnly: e.target.checked })} className="h-4 w-4 rounded border-border accent-rose-500" /> فقط تخفیف‌دارها</label>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium sm:hidden"><input type="checkbox" checked={value.inStockOnly} onChange={(e) => patch({ inStockOnly: e.target.checked })} className="h-4 w-4 rounded border-border accent-rose-500" /> فقط موجود</label>
    </div><div className="mt-4">{isFiltered && <Button type="button" variant="ghost" size="sm" onClick={onReset} className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" aria-hidden />پاک کردن فیلترها</Button>}</div></div>}
  </div>;
}
