'use client';

import { useEffect, useState } from 'react';

const keys = ['relevance','categoryMatch','recentBehavior','personalization','similarity','salesCount','viewCount','wishlistCount','reviewRating','reviewCount','recency','discounted','inStock'];
const placements = [
  ['HOME_HERO', 'Hero اصلی'],
  ['HOME_PROMO_1', 'بنر تبلیغاتی ۱'],
  ['HOME_PROMO_2', 'بنر تبلیغاتی ۲'],
  ['HOME_MID', 'بنر میانی'],
  ['HOME_CATEGORY', 'بنر دسته‌ها'],
  ['HOME_SELLER', 'فروشنده شوید'],
] as const;

type BannerForm = {
  id?: string;
  key: string;
  placement: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  startAt: string;
  endAt: string;
  sortOrder: number;
  autoSlide: boolean;
  durationMs: number;
  isActive: boolean;
};

const emptyBanner: BannerForm = { key: 'home-hero-1', placement: 'HOME_HERO', title: '', subtitle: '', ctaLabel: '', href: '/shop', desktopImageUrl: '', mobileImageUrl: '', startAt: '', endAt: '', sortOrder: 0, autoSlide: true, durationMs: 5000, isActive: true };

export function MarketplaceControls({ locale }: { locale: string }) {
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [banner, setBanner] = useState<BannerForm>(emptyBanner);
  const [banners, setBanners] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState<'desktop' | 'mobile' | null>(null);

  const copy = locale === 'en'
    ? { save: 'Save', saving: 'Saving…', saved: 'Saved', failed: 'Save failed', upload: 'Upload image', delete: 'Delete', active: 'Active' }
    : { save: 'ذخیره', saving: 'در حال ذخیره…', saved: 'ذخیره شد', failed: 'ذخیره ناموفق بود', upload: 'آپلود تصویر', delete: 'حذف', active: 'فعال' };

  async function load() {
    try {
      const [ranking, bannerList] = await Promise.all([
        fetch('/api/admin/recommendations').then((r) => r.json()),
        fetch('/api/admin/banners').then((r) => r.json()),
      ]);
      setWeights(ranking?.data?.weights ?? {});
      setBanners(bannerList?.data ?? []);
    } catch {
      setStatus(locale === 'en' ? 'Failed to load controls' : 'بارگذاری تنظیمات ناموفق بود');
    }
  }

  useEffect(() => { void load(); }, [locale]);

  async function saveWeights() {
    setStatus(copy.saving);
    const res = await fetch('/api/admin/recommendations', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(weights) });
    setStatus(res.ok ? copy.saved : copy.failed);
  }

  async function uploadImage(kind: 'desktop' | 'mobile', file: File | undefined) {
    if (!file) return;
    setUploading(kind);
    setStatus(locale === 'en' ? 'Uploading…' : 'در حال آپلود…');
    try {
      const form = new FormData();
      form.set('file', file);
      const res = await fetch('/api/admin/media', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.data?.url) throw new Error('upload_failed');
      setBanner((current) => ({ ...current, [kind === 'desktop' ? 'desktopImageUrl' : 'mobileImageUrl']: data.data.url }));
      setStatus(locale === 'en' ? 'Image uploaded' : 'تصویر آپلود شد');
    } catch {
      setStatus(locale === 'en' ? 'Image upload failed' : 'آپلود تصویر ناموفق بود');
    } finally { setUploading(null); }
  }

  async function saveBanner() {
    if (!banner.desktopImageUrl) {
      setStatus(locale === 'en' ? 'Desktop image is required' : 'تصویر دسکتاپ الزامی است');
      return;
    }
    setStatus(copy.saving);
    const payload = { ...banner, startAt: banner.startAt ? new Date(banner.startAt).toISOString() : null, endAt: banner.endAt ? new Date(banner.endAt).toISOString() : null };
    const res = await fetch('/api/admin/banners', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      setBanner(emptyBanner);
      await load();
      setStatus(locale === 'en' ? 'Banner saved' : 'بنر ذخیره شد');
    } else setStatus(copy.failed);
  }

  function editBanner(item: Record<string, unknown>) {
    setBanner({
      id: String(item.id ?? ''),
      key: String(item.key ?? ''), placement: String(item.placement ?? 'HOME_HERO'), title: String(item.title ?? ''), subtitle: String(item.subtitle ?? ''), ctaLabel: String(item.ctaLabel ?? ''), href: String(item.href ?? ''), desktopImageUrl: String(item.desktopImageUrl ?? ''), mobileImageUrl: String(item.mobileImageUrl ?? ''), startAt: item.startAt ? new Date(String(item.startAt)).toISOString().slice(0,16) : '', endAt: item.endAt ? new Date(String(item.endAt)).toISOString().slice(0,16) : '', sortOrder: Number(item.sortOrder ?? 0), autoSlide: Boolean(item.autoSlide ?? true), durationMs: Number(item.durationMs ?? 5000), isActive: Boolean(item.isActive ?? true),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteBanner(id: string) {
    await fetch(`/api/admin/banners?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setBanners((items) => items.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-black">{locale === 'en' ? 'Recommendation weights' : 'وزن‌های پیشنهاد و رتبه‌بندی'}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{locale === 'en' ? 'Tune ranking without changing code.' : 'وزن‌های الگوریتم را بدون تغییر کد تنظیم کنید.'}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {keys.map((key) => <label key={key} className="rounded-xl border border-border p-3"><span className="block text-xs font-semibold">{key}</span><input type="number" min="0" max="100" step="0.1" value={weights[key] ?? 0} onChange={(event) => setWeights((current) => ({ ...current, [key]: Number(event.target.value) }))} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label>)}
        </div>
        <button type="button" onClick={() => void saveWeights()} className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">{locale === 'en' ? 'Save ranking' : 'ذخیره رتبه‌بندی'}</button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-black">{locale === 'en' ? 'Banner Manager' : 'مدیریت بنرها'}</h2><p className="mt-1 text-xs text-muted-foreground">جایگاه، زمان‌بندی، تصاویر، CTA و فعال/غیرفعال بودن را بدون تغییر کد مدیریت کنید.</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">HOME</span></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label><span className="mb-1 block text-xs font-semibold">کلید</span><input value={banner.key} onChange={(event) => setBanner((current) => ({ ...current, key: event.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label>
          <label><span className="mb-1 block text-xs font-semibold">جایگاه</span><select value={banner.placement} onChange={(event) => setBanner((current) => ({ ...current, placement: event.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">{placements.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {(['title','subtitle','ctaLabel','href'] as const).map((field) => <label key={field} className={field === 'subtitle' ? 'sm:col-span-2' : ''}><span className="mb-1 block text-xs font-semibold">{field}</span><input value={banner[field]} onChange={(event) => setBanner((current) => ({ ...current, [field]: event.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label>)}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="rounded-xl border border-dashed border-border p-3"><span className="block text-xs font-semibold">تصویر دسکتاپ</span>{banner.desktopImageUrl && <img src={banner.desktopImageUrl} alt="desktop" className="mt-2 h-24 w-full rounded-lg object-cover" />}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => void uploadImage('desktop', event.target.files?.[0])} className="mt-2 w-full text-xs" /><p className="mt-1 text-[10px] text-muted-foreground">{uploading === 'desktop' ? 'در حال آپلود…' : copy.upload}</p></label>
          <label className="rounded-xl border border-dashed border-border p-3"><span className="block text-xs font-semibold">تصویر موبایل</span>{banner.mobileImageUrl && <img src={banner.mobileImageUrl} alt="mobile" className="mt-2 h-24 w-full rounded-lg object-cover" />}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => void uploadImage('mobile', event.target.files?.[0])} className="mt-2 w-full text-xs" /><p className="mt-1 text-[10px] text-muted-foreground">{uploading === 'mobile' ? 'در حال آپلود…' : copy.upload}</p></label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label><span className="text-xs">شروع</span><input type="datetime-local" value={banner.startAt} onChange={(event) => setBanner((current) => ({ ...current, startAt: event.target.value }))} className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-2 text-xs" /></label>
          <label><span className="text-xs">پایان</span><input type="datetime-local" value={banner.endAt} onChange={(event) => setBanner((current) => ({ ...current, endAt: event.target.value }))} className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-2 text-xs" /></label>
          <label><span className="text-xs">ترتیب</span><input type="number" value={banner.sortOrder} onChange={(event) => setBanner((current) => ({ ...current, sortOrder: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-2 text-xs" /></label>
          <label><span className="text-xs">مدت اسلاید</span><input type="number" min="3000" max="30000" step="500" value={banner.durationMs} onChange={(event) => setBanner((current) => ({ ...current, durationMs: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-2 text-xs" /></label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={banner.autoSlide} onChange={(event) => setBanner((current) => ({ ...current, autoSlide: event.target.checked }))} /> اجرای خودکار</label><label className="flex items-center gap-2"><input type="checkbox" checked={banner.isActive} onChange={(event) => setBanner((current) => ({ ...current, isActive: event.target.checked }))} /> {copy.active}</label></div>
        <button type="button" onClick={() => void saveBanner()} className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">{copy.save} بنر</button>

        <div className="mt-6 space-y-2">{banners.map((item) => <div key={String(item.id)} className="flex items-center gap-3 rounded-xl border border-border p-3 text-xs"><div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">{item.desktopImageUrl ? <img src={String(item.desktopImageUrl)} alt="" className="h-full w-full object-cover" /> : null}</div><div className="min-w-0 flex-1"><b className="block truncate">{String(item.title || item.key)}</b><span className="text-muted-foreground">{String(item.placement)} · {item.isActive ? copy.active : 'غیرفعال'}</span></div><button type="button" onClick={() => editBanner(item)} className="font-bold text-primary">ویرایش</button><button type="button" onClick={() => void deleteBanner(String(item.id))} className="font-bold text-destructive">{copy.delete}</button></div>)}</div>
        {status ? <p className="mt-4 text-xs font-semibold text-muted-foreground">{status}</p> : null}
      </section>
    </div>
  );
}
