'use client';

import * as React from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ShopSort = 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating' | 'recommended';
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

const COPY = {
  fa: {
    sort: 'مرتب‌سازی', recommended: 'پیشنهادی', newest: 'جدیدترین', popular: 'پرفروش‌ترین', rating: 'امتیاز بالاتر', priceAsc: 'ارزان‌ترین', priceDesc: 'گران‌ترین', stock: 'فقط موجود', more: 'فیلترهای بیشتر', activeSub: 'زیر‌دسته فعال', subcategory: 'زیر‌دسته', allSubcategories: 'همه زیر‌دسته‌ها', seller: 'فروشنده', allSellers: 'همه فروشندگان', badge: 'نشان محصول', all: 'همه', new: 'جدید', best: 'پرفروش', last: 'آخرین موجودی', sale: 'فروش ویژه', minRating: 'حداقل امتیاز', allRatings: 'همه امتیازها', priceMin: 'قیمت از', priceMax: 'قیمت تا', minimum: 'حداقل', maximum: 'حداکثر', discount: 'فقط تخفیف‌دارها', clear: 'پاک کردن فیلترها', stars4: '۴ ستاره و بیشتر', stars3: '۳ ستاره و بیشتر', stars2: '۲ ستاره و بیشتر', view: 'نمایش فیلترها' },
  ps: {
    sort: 'ترتیب', recommended: 'سپارښتل شوي', newest: 'نوي', popular: 'ډېر پلورل شوي', rating: 'لوړه درجه', priceAsc: 'ارزان', priceDesc: 'ګران', stock: 'یوازې موجود', more: 'نور فلټرونه', activeSub: 'فعاله فرعي وېشنیزه', subcategory: 'فرعي وېشنیزه', allSubcategories: 'ټولې فرعي وېشنیزې', seller: 'پلورونکی', allSellers: 'ټول پلورونکي', badge: 'د محصول نښه', all: 'ټول', new: 'نوی', best: 'ډېر پلورل شوی', last: 'وروستی موجود', sale: 'ځانګړی پلور', minRating: 'لږ تر لږه درجه', allRatings: 'ټولې درجې', priceMin: 'قیمت له', priceMax: 'قیمت تر', minimum: 'لږ تر لږه', maximum: 'تر ډېره', discount: 'یوازې تخفیف لرونکي', clear: 'فلټرونه پاک کړئ', stars4: '۴ ستوري او پورته', stars3: '۳ ستوري او پورته', stars2: '۲ ستوري او پورته', view: 'فلټرونه ښکاره کړئ' },
  en: {
    sort: 'Sort', recommended: 'Recommended', newest: 'Newest', popular: 'Best selling', rating: 'Highest rated', priceAsc: 'Price low to high', priceDesc: 'Price high to low', stock: 'In stock only', more: 'More filters', activeSub: 'Active subcategory', subcategory: 'Subcategory', allSubcategories: 'All subcategories', seller: 'Seller', allSellers: 'All sellers', badge: 'Product badge', all: 'All', new: 'New', best: 'Best seller', last: 'Last stock', sale: 'Sale', minRating: 'Minimum rating', allRatings: 'All ratings', priceMin: 'Price from', priceMax: 'Price to', minimum: 'Minimum', maximum: 'Maximum', discount: 'Discounted only', clear: 'Clear filters', stars4: '4 stars and up', stars3: '3 stars and up', stars2: '2 stars and up', view: 'Show filters' },
} as const;

type Locale = keyof typeof COPY;

const SORT_KEYS: ShopSort[] = ['recommended', 'newest', 'popular', 'rating', 'price_asc', 'price_desc'];

interface ShopFiltersProps { value: ShopFiltersValue; onChange: (v: ShopFiltersValue) => void; onReset: () => void; subcategories?: ShopOption[]; sellers?: ShopOption[]; locale?: string; }

export function ShopFilters({ value, onChange, onReset, subcategories = [], sellers = [], locale = 'fa' }: ShopFiltersProps) {
  const [expanded, setExpanded] = React.useState(false);
  const lang: Locale = locale === 'en' || locale === 'ps' ? locale : 'fa';
  const t = COPY[lang];
  const isFiltered = value.subcategoryKey !== '' || value.sellerId !== '' || value.badge !== '' || value.priceMin !== '' || value.priceMax !== '' || value.inStockOnly || value.hasDiscountOnly || value.minRating !== '';
  const patch = (partial: Partial<ShopFiltersValue>) => onChange({ ...value, ...partial });
  const sortLabel = (sort: ShopSort) => ({ recommended: t.recommended, newest: t.newest, popular: t.popular, rating: t.rating, price_asc: t.priceAsc, price_desc: t.priceDesc })[sort];
  return <div className="rounded-2xl border border-border bg-card shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2"><label htmlFor="filter-sort" className="whitespace-nowrap text-xs font-medium">{t.sort}:</label><select id="filter-sort" value={value.sort} onChange={(e) => patch({ sort: e.target.value as ShopSort })} className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs" aria-label={t.sort}>{SORT_KEYS.map((key) => <option key={key} value={key}>{sortLabel(key)}</option>)}</select></div>
        <label className="hidden items-center gap-2 text-xs font-medium sm:flex"><input type="checkbox" checked={value.inStockOnly} onChange={(e) => patch({ inStockOnly: e.target.checked })} className="h-4 w-4 rounded border-border accent-rose-500" /> {t.stock}</label>
        {value.subcategoryKey ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{t.activeSub}</span> : null}
      </div>
      <button type="button" onClick={() => setExpanded((current) => !current)} className="flex min-h-9 items-center gap-1.5 text-xs font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-expanded={expanded} aria-controls="advanced-product-filters"><span>{t.more}</span>{expanded ? <ChevronUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}</button>
    </div>
    {expanded && <div id="advanced-product-filters" className="border-t border-border p-3.5 sm:p-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div><label htmlFor="filter-subcategory" className="mb-1 block text-xs text-muted-foreground">{t.subcategory}</label><select id="filter-subcategory" value={value.subcategoryKey} onChange={(e) => patch({ subcategoryKey: e.target.value })} className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs"><option value="">{t.allSubcategories}</option>{subcategories.map((s) => <option key={s.key} value={s.key}>{s.label}{typeof s.count === 'number' ? ` (${s.count})` : ''}</option>)}</select></div>
      <div><label htmlFor="filter-seller" className="mb-1 block text-xs text-muted-foreground">{t.seller}</label><select id="filter-seller" value={value.sellerId} onChange={(e) => patch({ sellerId: e.target.value })} className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs"><option value="">{t.allSellers}</option>{sellers.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
      <div><label htmlFor="filter-badge" className="mb-1 block text-xs text-muted-foreground">{t.badge}</label><select id="filter-badge" value={value.badge} onChange={(e) => patch({ badge: e.target.value })} className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs"><option value="">{t.all}</option><option value="new">{t.new}</option><option value="best">{t.best}</option><option value="last">{t.last}</option><option value="sale">{t.sale}</option></select></div>
      <div><label htmlFor="filter-rating" className="mb-1 block text-xs text-muted-foreground">{t.minRating}</label><select id="filter-rating" value={value.minRating} onChange={(e) => patch({ minRating: e.target.value ? Number(e.target.value) : '' })} className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs"><option value="">{t.allRatings}</option><option value="4">{t.stars4}</option><option value="3">{t.stars3}</option><option value="2">{t.stars2}</option></select></div>
      <div><label htmlFor="filter-price-min" className="mb-1 block text-xs text-muted-foreground">{t.priceMin}</label><input id="filter-price-min" type="number" min="0" inputMode="numeric" value={value.priceMin} onChange={(e) => patch({ priceMin: e.target.value ? Number(e.target.value) : '' })} placeholder={t.minimum} dir="ltr" className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs" /></div>
      <div><label htmlFor="filter-price-max" className="mb-1 block text-xs text-muted-foreground">{t.priceMax}</label><input id="filter-price-max" type="number" min="0" inputMode="numeric" value={value.priceMax} onChange={(e) => patch({ priceMax: e.target.value ? Number(e.target.value) : '' })} placeholder={t.maximum} dir="ltr" className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs" /></div>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium"><input type="checkbox" checked={value.hasDiscountOnly} onChange={(e) => patch({ hasDiscountOnly: e.target.checked })} className="h-4 w-4 rounded border-border accent-rose-500" /> {t.discount}</label>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium sm:hidden"><input type="checkbox" checked={value.inStockOnly} onChange={(e) => patch({ inStockOnly: e.target.checked })} className="h-4 w-4 rounded border-border accent-rose-500" /> {t.stock}</label>
    </div><div className="mt-4">{isFiltered && <Button type="button" variant="ghost" size="sm" onClick={onReset} className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" aria-hidden />{t.clear}</Button>}</div></div>}
  </div>;
}
