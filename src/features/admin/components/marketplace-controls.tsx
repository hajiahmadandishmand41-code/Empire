'use client';

import { useEffect, useState } from 'react';
import { BrainCircuit, RotateCcw, Save } from 'lucide-react';

const recommendationKeys = [
  ['relevance', 'ارتباط با جستجو'], ['categoryMatch', 'تطابق دسته‌بندی'], ['personalization', 'شخصی‌سازی'],
  ['similarity', 'شباهت محصول'], ['sales', 'تعداد فروش'], ['clicks', 'تعداد بازدید'],
  ['addToCart', 'افزودن به سبد'], ['purchases', 'تعداد خرید'], ['rating', 'امتیاز نظرات'], ['reviews', 'تعداد نظرات'],
  ['freshness', 'تازگی محصول'], ['discounted', 'دارای تخفیف'], ['stock', 'موجودی'],
] as const;

export function MarketplaceControls(_: { locale: string }) {
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const response = await fetch('/api/admin/recommendations', { cache: 'no-store' });
      const body = await response.json();
      setWeights(body?.data?.weights ?? {});
    } catch { setStatus('بارگذاری وزن‌های پیشنهاد ناموفق بود.'); }
  }

  useEffect(() => { void load(); }, []);

  async function save() {
    setSaving(true);
    setStatus('در حال ذخیره تنظیمات…');
    try {
      const response = await fetch('/api/admin/recommendations', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(weights) });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? 'ذخیره ناموفق بود.');
      setStatus('تنظیمات پیشنهاد با موفقیت ذخیره شد.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'ذخیره ناموفق بود.'); }
    finally { setSaving(false); }
  }

  function reset() {
    const defaults: Record<string, number> = {
      relevance: 4, sales: 4, clicks: 1, addToCart: 2, purchases: 5, rating: 1.5, reviews: 0.8,
      freshness: 1.5, stock: 10, personalization: 3, categoryMatch: 3, similarity: 2, discounted: 0.5,
    };
    setWeights(defaults);
    setStatus('مقادیر پیش‌فرض آماده شد؛ برای ثبت روی ذخیره بزنید.');
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /><h2 className="text-xl font-black">الگوریتم پیشنهاد محصولات</h2></div><p className="mt-1 text-xs leading-6 text-muted-foreground">وزن‌های رتبه‌بندی را از اینجا تنظیم کنید؛ فقط گزینه‌هایی نمایش داده می‌شوند که در قرارداد فعلی الگوریتم استفاده می‌شوند.</p></div><button type="button" onClick={reset} className="inline-flex items-center gap-2 self-start rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted"><RotateCcw className="h-4 w-4" /> بازنشانی</button></div>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {recommendationKeys.map(([key, label]) => <label key={key} className="rounded-2xl border border-border bg-background p-4"><span className="block text-sm font-bold">{label}</span><input type="number" step="0.1" min="0" max="100" value={Number(weights[key] ?? 0)} onChange={(e) => setWeights((current) => ({ ...current, [key]: Number(e.target.value) || 0 }))} className="mt-3 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" aria-label={label} /></label>)}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3"><button type="button" disabled={saving} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات'}</button>{status ? <span role="status" className="text-xs font-semibold text-muted-foreground">{status}</span> : null}</div>
    </section>
  );
}
