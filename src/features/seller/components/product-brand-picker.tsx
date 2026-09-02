'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Tags } from 'lucide-react';

type Brand = { id: string; name: string; isActive: boolean };

export function ProductBrandPicker({ productId, initialBrandId = null }: { productId: string; initialBrandId?: string | null }) {
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [value, setValue] = React.useState(initialBrandId ?? '');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/seller/brands', { credentials: 'include', cache: 'no-store' });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? 'خطا در دریافت برندها');
        if (!cancelled) setBrands((Array.isArray(body.data) ? body.data : []).filter((brand: Brand) => brand.isActive));
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'خطا در دریافت برندها');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function save(nextValue: string) {
    const previous = value;
    setValue(nextValue);
    setBusy(true);
    try {
      const response = await fetch(`/api/seller/products/${productId}/brand`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ brandId: nextValue || null }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? 'ذخیره برند ناموفق بود');
      toast.success(nextValue ? 'برند محصول ذخیره شد.' : 'برند محصول حذف شد.');
    } catch (error) {
      setValue(previous);
      toast.error(error instanceof Error ? error.message : 'خطا در ذخیره برند');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm" dir="rtl">
      <div className="flex items-center gap-2"><Tags className="h-5 w-5 text-primary" /><h2 className="text-base font-black">برند محصول</h2></div>
      <p className="mt-1 text-xs text-muted-foreground">مانند الگوی Seller Center مرجع، برند از فهرست برندهای همین فروشنده انتخاب می‌شود و مستقیماً به محصول متصل می‌گردد.</p>
      <select disabled={loading || busy} value={value} onChange={(event) => void save(event.target.value)} className="mt-4 h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm outline-none focus:border-primary">
        <option value="">بدون برند</option>
        {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
      </select>
      {!loading && brands.length === 0 ? <p className="mt-2 text-[11px] text-muted-foreground">ابتدا در بخش «برندها» یک برند فعال ایجاد کنید.</p> : null}
    </section>
  );
}
