'use client';

import { useEffect, useState } from 'react';
import { BrainCircuit, RotateCcw, Save } from 'lucide-react';

const recommendationKeys = [
  ['relevance', 'ارتباط با جستجو'], ['categoryMatch', 'تطابق دسته‌بندی'], ['recentBehavior', 'رفتار اخیر کاربر'],
  ['personalization', 'شخصی‌سازی'], ['similarity', 'شباهت محصول'], ['salesCount', 'تعداد فروش'], ['viewCount', 'تعداد بازدید'],
  ['wishlistCount', 'افزودن به علاقه‌مندی'], ['reviewRating', 'امتیاز نظرات'], ['reviewCount', 'تعداد نظرات'], ['recency', 'تازگی محصول'],
  ['discounted', 'دارای تخفیف'], ['inStock', 'موجودی'],
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
    setStatus('در حال ذخیره وزن‌های پیشنهاد…');
    try {
      const response = await fetch('/api/admin/recommendations', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(weights) });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? 'ذخیره ناموفق بود.');
      setStatus('وزن‌های الگوریتم با موفقیت ذخیره شد.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'ذخیره ناموفق بود.'); }
    finally { setSaving(false); }
  }

  function reset() {
    const defaults: Record<string, number> = {};
    for (const [key] of recommendationKeys) defaults[key] = key === 'relevance' || key === 'categoryMatch' ? 1 : 0;
    setWeights(defaults);
    setStatus('مقادیر بازنشانی شد؛ برای ثبت روی ذخیره بزنید.');
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /><h2 className="text-xl font-black">الگوریتم پیشنهاد محصولات</h2></div><p className="mt-1 text-xs leading-6 text-muted-foreground">این صفحه فقط وزن‌های رتبه‌بندی را کنترل می‌کند؛ تنظیم بنرها در صفحه مستقل بنرها انجام می‌شود.</p></div><button type="button" onClick={reset} className="inline-flex items-center gap-2 self-start rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted"><RotateCcw className="h-4 w-4" /> بازنشانی</button></div>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {recommendationKeys.map(([key, label]) => <label key={key} className="rounded-2xl border border-border bg-background p-4"><span className="block text-sm font-bold">{label}</span><span className="mt-1 block font-mono text-[10px] text-muted-foreground" dir="ltr">{key}</span><input type="number" step="0.1" min="-10" max="10" value={Number(weights[key] ?? 0)} onChange={(e) => setWeights((current) => ({ ...current, [key]: Number(e.target.value) || 0 }))} className="mt-3 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label>)}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3"><button type="button" disabled={saving} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات'}</button>{status ? <span className="text-xs font-semibold text-muted-foreground">{status}</span> : null}</div>
    </section>
  );
}
