'use client';

import { useEffect, useState } from 'react';

const keys = ['relevance','categoryMatch','recentBehavior','personalization','similarity','salesCount','viewCount','wishlistCount','reviewRating','reviewCount','recency','discounted','inStock'];

export function MarketplaceControls({ locale }: { locale: string }) {
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [banner, setBanner] = useState({ key: 'home-hero-1', placement: 'hero', title: '', subtitle: '', ctaLabel: '', href: '', desktopImageUrl: '', mobileImageUrl: '', sortOrder: 0, autoSlide: true, durationMs: 5000, isActive: true });
  const [banners, setBanners] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    void Promise.all([
      fetch('/api/admin/recommendations').then((r) => r.json()).then((d) => setWeights(d?.data?.weights ?? {})),
      fetch('/api/admin/banners').then((r) => r.json()).then((d) => setBanners(d?.data ?? [])),
    ]).catch(() => setStatus(locale === 'en' ? 'Failed to load controls' : 'بارگذاری تنظیمات ناموفق بود'));
  }, [locale]);

  async function saveWeights() {
    setStatus(locale === 'en' ? 'Saving…' : 'در حال ذخیره…');
    const res = await fetch('/api/admin/recommendations', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(weights) });
    setStatus(res.ok ? (locale === 'en' ? 'Saved' : 'ذخیره شد') : (locale === 'en' ? 'Save failed' : 'ذخیره ناموفق بود'));
  }

  async function saveBanner() {
    setStatus(locale === 'en' ? 'Saving banner…' : 'در حال ذخیره بنر…');
    const res = await fetch('/api/admin/banners', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(banner) });
    if (res.ok) {
      const refreshed = await fetch('/api/admin/banners').then((r) => r.json());
      setBanners(refreshed?.data ?? []);
      setStatus(locale === 'en' ? 'Banner saved' : 'بنر ذخیره شد');
    } else setStatus(locale === 'en' ? 'Banner save failed' : 'ذخیره بنر ناموفق بود');
  }

  async function deleteBanner(id: string) {
    await fetch(`/api/admin/banners?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setBanners((items) => items.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-black">{locale === 'en' ? 'Recommendation weights' : 'وزن‌های پیشنهاد و رتبه‌بندی'}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{locale === 'en' ? 'Tune relevance, personalization and popularity without changing code.' : 'وزن‌های الگوریتم را بدون تغییر کد تنظیم کنید.'}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {keys.map((key) => <label key={key} className="rounded-xl border border-border p-3"><span className="block text-xs font-semibold text-foreground">{key}</span><input type="number" min="0" max="100" step="0.1" value={weights[key] ?? 0} onChange={(e) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label>)}
        </div>
        <button onClick={() => void saveWeights()} className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">{locale === 'en' ? 'Save ranking' : 'ذخیره رتبه‌بندی'}</button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-black">{locale === 'en' ? 'Dynamic banners' : 'بنرهای پویا'}</h2>
        <div className="mt-4 grid gap-3">
          {(['key','placement','title','subtitle','ctaLabel','href','desktopImageUrl','mobileImageUrl'] as const).map((field) => <label key={field}><span className="mb-1 block text-xs font-semibold">{field}</span><input value={banner[field]} onChange={(e) => setBanner((b) => ({ ...b, [field]: e.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label>)}
          <div className="grid grid-cols-3 gap-2"><label><span className="text-xs">sortOrder</span><input type="number" value={banner.sortOrder} onChange={(e) => setBanner((b) => ({ ...b, sortOrder: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label><label><span className="text-xs">durationMs</span><input type="number" value={banner.durationMs} onChange={(e) => setBanner((b) => ({ ...b, durationMs: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label><label className="flex items-end gap-2 pb-2 text-xs"><input type="checkbox" checked={banner.isActive} onChange={(e) => setBanner((b) => ({ ...b, isActive: e.target.checked }))} /> active</label></div>
          <button onClick={() => void saveBanner()} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">{locale === 'en' ? 'Save banner' : 'ذخیره بنر'}</button>
        </div>
        <div className="mt-6 space-y-2">{banners.map((item) => <div key={String(item.id)} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-xs"><div className="min-w-0"><b>{String(item.key)}</b><span className="ms-2 text-muted-foreground">{String(item.placement)}</span></div><button onClick={() => void deleteBanner(String(item.id))} className="text-red-500">{locale === 'en' ? 'Delete' : 'حذف'}</button></div>)}</div>
        {status ? <p className="mt-4 text-xs font-semibold text-muted-foreground">{status}</p> : null}
      </section>
    </div>
  );
}
