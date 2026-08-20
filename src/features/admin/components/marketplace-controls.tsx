'use client';

import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Monitor, Smartphone, CalendarClock, Eye, EyeOff, GripVertical, Save, Trash2, Pencil, Sparkles, SlidersHorizontal } from 'lucide-react';

const recommendationKeys = ['relevance','categoryMatch','recentBehavior','personalization','similarity','salesCount','viewCount','wishlistCount','reviewRating','reviewCount','recency','discounted','inStock'];
const placements = [
  { value: 'HOME_HERO', label: 'هیرو اصلی صفحه خانه', hint: 'بنر اصلی بالای صفحه' },
  { value: 'HOME_PROMO_1', label: 'بنر تبلیغاتی ۱', hint: 'کمپین تبلیغاتی اول' },
  { value: 'HOME_PROMO_2', label: 'بنر تبلیغاتی ۲', hint: 'کمپین تبلیغاتی دوم' },
  { value: 'HOME_MID', label: 'بنر میانی', hint: 'بین بخش‌های محتوایی خانه' },
  { value: 'HOME_CATEGORY', label: 'بنر دسته‌بندی‌ها', hint: 'کنار یا بالای دسته‌ها' },
  { value: 'HOME_SELLER', label: 'فروشنده شوید', hint: 'فراخوان جذب فروشنده' },
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

const emptyBanner: BannerForm = {
  key: 'home-hero-1', placement: 'HOME_HERO', title: '', subtitle: '', ctaLabel: '', href: '/shop',
  desktopImageUrl: '', mobileImageUrl: '', startAt: '', endAt: '', sortOrder: 0, autoSlide: true, durationMs: 5000, isActive: true,
};

const inputClass = 'w-full rounded-xl border border-slate-200 bg-background px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700';
const labelClass = 'mb-1.5 block text-xs font-black text-slate-700 dark:text-slate-200';

export function MarketplaceControls(_: { locale: string }) {
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [banner, setBanner] = useState<BannerForm>(emptyBanner);
  const [banners, setBanners] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState<'desktop' | 'mobile' | null>(null);
  const [preview, setPreview] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);

  const placementMeta = useMemo(() => placements.find((item) => item.value === banner.placement) ?? placements[0], [banner.placement]);

  async function load() {
    try {
      const [ranking, bannerList] = await Promise.all([
        fetch('/api/admin/recommendations').then((response) => response.json()),
        fetch('/api/admin/banners').then((response) => response.json()),
      ]);
      setWeights(ranking?.data?.weights ?? {});
      setBanners(bannerList?.data ?? []);
    } catch {
      setStatus('بارگذاری تنظیمات ناموفق بود. دوباره تلاش کنید.');
    }
  }

  useEffect(() => { void load(); }, []);

  async function saveWeights() {
    setStatus('در حال ذخیره رتبه‌بندی...');
    const response = await fetch('/api/admin/recommendations', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(weights) });
    setStatus(response.ok ? 'رتبه‌بندی با موفقیت ذخیره شد.' : 'ذخیره رتبه‌بندی ناموفق بود.');
  }

  async function uploadImage(kind: 'desktop' | 'mobile', file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setStatus('فقط فایل تصویری قابل قبول است.'); return; }
    setUploading(kind);
    setStatus('در حال آپلود تصویر...');
    try {
      const form = new FormData();
      form.set('file', file);
      const response = await fetch('/api/admin/media', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok || !data?.ok || !data?.data?.url) throw new Error('upload_failed');
      setBanner((current) => ({ ...current, [kind === 'desktop' ? 'desktopImageUrl' : 'mobileImageUrl']: data.data.url }));
      setStatus(kind === 'desktop' ? 'تصویر دسکتاپ آماده شد.' : 'تصویر موبایل آماده شد.');
    } catch {
      setStatus('آپلود تصویر ناموفق بود.');
    } finally { setUploading(null); }
  }

  async function saveBanner() {
    if (!banner.key.trim()) { setStatus('کلید بنر الزامی است.'); return; }
    if (!banner.desktopImageUrl) { setStatus('تصویر دسکتاپ الزامی است.'); return; }
    if (banner.durationMs < 1500 || banner.durationMs > 30000) { setStatus('مدت اسلاید باید بین ۱۵۰۰ تا ۳۰۰۰۰ میلی‌ثانیه باشد.'); return; }
    setSaving(true);
    setStatus('در حال ذخیره بنر...');
    try {
      const payload = { ...banner, startAt: banner.startAt ? new Date(banner.startAt).toISOString() : null, endAt: banner.endAt ? new Date(banner.endAt).toISOString() : null };
      const response = await fetch('/api/admin/banners', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) { setStatus('ذخیره بنر ناموفق بود.'); return; }
      setBanner(emptyBanner);
      await load();
      setStatus('بنر با موفقیت ذخیره شد.');
    } catch {
      setStatus('خطا در ذخیره بنر.');
    } finally { setSaving(false); }
  }

  function editBanner(item: Record<string, unknown>) {
    setBanner({
      id: String(item.id ?? ''), key: String(item.key ?? ''), placement: String(item.placement ?? 'HOME_HERO'),
      title: String(item.title ?? ''), subtitle: String(item.subtitle ?? ''), ctaLabel: String(item.ctaLabel ?? ''), href: String(item.href ?? ''),
      desktopImageUrl: String(item.desktopImageUrl ?? ''), mobileImageUrl: String(item.mobileImageUrl ?? ''),
      startAt: item.startAt ? new Date(String(item.startAt)).toISOString().slice(0, 16) : '',
      endAt: item.endAt ? new Date(String(item.endAt)).toISOString().slice(0, 16) : '',
      sortOrder: Number(item.sortOrder ?? 0), autoSlide: Boolean(item.autoSlide ?? true), durationMs: Number(item.durationMs ?? 5000), isActive: Boolean(item.isActive ?? true),
    });
    setPreview('desktop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteBanner(id: string) {
    if (!window.confirm('این بنر حذف شود؟')) return;
    const response = await fetch(`/api/admin/banners?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (response.ok) { setBanners((items) => items.filter((item) => item.id !== id)); setStatus('بنر حذف شد.'); }
    else setStatus('حذف بنر ناموفق بود.');
  }

  const activeCount = banners.filter((item) => Boolean(item.isActive)).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'کل بنرها', value: banners.length, icon: MegaphoneIcon },
          { label: 'بنرهای فعال', value: activeCount, icon: Eye },
          { label: 'جایگاه‌های قابل مدیریت', value: placements.length, icon: SlidersHorizontal },
        ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500">{label}</span><Icon className="h-4 w-4 text-indigo-500" aria-hidden="true" /></div><p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p></div>)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
            <div><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-indigo-500" aria-hidden="true" /><h2 className="text-lg font-black">استودیوی تنظیم بنر</h2></div><p className="mt-1 text-xs leading-6 text-slate-500">هر بنر را با جایگاه، محتوا، رسانه، زمان‌بندی و رفتار نمایش جداگانه مدیریت کنید.</p></div>
            <div className={banner.isActive ? 'rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-500'}>{banner.isActive ? 'فعال' : 'غیرفعال'}</div>
          </div>

          <div className="space-y-6 pt-5">
            <div><h3 className="text-sm font-black">۱. مشخصات و جایگاه</h3><p className="mt-1 text-xs text-slate-500">این بخش تعیین می‌کند بنر کجا و با چه اولویتی نمایش داده شود.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className={labelClass}>کلید یکتا</span><input value={banner.key} onChange={(event) => setBanner((current) => ({ ...current, key: event.target.value }))} className={inputClass} placeholder="home-hero-1" /></label><label><span className={labelClass}>جایگاه نمایش</span><select value={banner.placement} onChange={(event) => setBanner((current) => ({ ...current, placement: event.target.value }))} className={inputClass}>{placements.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><span className="mt-1 block text-[10px] text-slate-400">{placementMeta.hint}</span></label><label><span className={labelClass}>اولویت نمایش</span><input type="number" min="0" max="10000" value={banner.sortOrder} onChange={(event) => setBanner((current) => ({ ...current, sortOrder: Number(event.target.value) }))} className={inputClass} /><span className="mt-1 block text-[10px] text-slate-400">عدد کمتر یعنی نمایش زودتر.</span></label><div className="flex items-end"><label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold dark:border-slate-700"><input type="checkbox" checked={banner.isActive} onChange={(event) => setBanner((current) => ({ ...current, isActive: event.target.checked }))} /> بنر فعال باشد</label></div></div></div>

            <div className="border-t border-slate-100 pt-6 dark:border-slate-800"><h3 className="text-sm font-black">۲. محتوای بنر</h3><div className="mt-4 grid gap-4"><label><span className={labelClass}>عنوان</span><input value={banner.title} onChange={(event) => setBanner((current) => ({ ...current, title: event.target.value }))} className={inputClass} /></label><label><span className={labelClass}>زیرعنوان</span><textarea value={banner.subtitle} onChange={(event) => setBanner((current) => ({ ...current, subtitle: event.target.value }))} rows={3} className={inputClass + ' resize-none'} /></label><div className="grid gap-4 sm:grid-cols-2"><label><span className={labelClass}>متن دکمه</span><input value={banner.ctaLabel} onChange={(event) => setBanner((current) => ({ ...current, ctaLabel: event.target.value }))} className={inputClass} /></label><label><span className={labelClass}>لینک دکمه</span><input value={banner.href} onChange={(event) => setBanner((current) => ({ ...current, href: event.target.value }))} className={inputClass} placeholder="/shop" /></label></div></div></div>

            <div className="border-t border-slate-100 pt-6 dark:border-slate-800"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-black">۳. رسانه</h3><p className="mt-1 text-xs text-slate-500">نسخه دسکتاپ الزامی است؛ نسخه موبایل برای کنترل قاب تصویر پیشنهاد می‌شود.</p></div><ImagePlus className="h-5 w-5 text-indigo-500" aria-hidden="true" /></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><ImageUploadCard title="تصویر دسکتاپ" value={banner.desktopImageUrl} uploading={uploading === 'desktop'} onUpload={(file) => void uploadImage('desktop', file)} required /><ImageUploadCard title="تصویر موبایل" value={banner.mobileImageUrl} uploading={uploading === 'mobile'} onUpload={(file) => void uploadImage('mobile', file)} /></div></div>

            <div className="border-t border-slate-100 pt-6 dark:border-slate-800"><div className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-indigo-500" aria-hidden="true" /><h3 className="text-sm font-black">۴. زمان‌بندی و رفتار</h3></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className={labelClass}>شروع نمایش</span><input type="datetime-local" value={banner.startAt} onChange={(event) => setBanner((current) => ({ ...current, startAt: event.target.value }))} className={inputClass} /></label><label><span className={labelClass}>پایان نمایش</span><input type="datetime-local" value={banner.endAt} onChange={(event) => setBanner((current) => ({ ...current, endAt: event.target.value }))} className={inputClass} /></label><label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold dark:border-slate-700"><input type="checkbox" checked={banner.autoSlide} onChange={(event) => setBanner((current) => ({ ...current, autoSlide: event.target.checked }))} /> اسلاید به‌صورت خودکار اجرا شود</label><label><span className={labelClass}>مدت نمایش هر اسلاید (میلی‌ثانیه)</span><input type="number" min="1500" max="30000" step="500" value={banner.durationMs} onChange={(event) => setBanner((current) => ({ ...current, durationMs: Number(event.target.value) }))} className={inputClass} /><span className="mt-1 block text-[10px] text-slate-400">محدوده مجاز: ۱۵۰۰ تا ۳۰۰۰۰ میلی‌ثانیه.</span></label></div></div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row"><button type="button" onClick={() => void saveBanner()} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" aria-hidden="true" />{saving ? 'در حال ذخیره...' : banner.id ? 'ذخیره تغییرات' : 'ایجاد بنر'}</button><button type="button" onClick={() => { setBanner(emptyBanner); setStatus('فرم جدید آماده شد.'); }} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900">فرم جدید</button></div>
            {status ? <p role="status" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{status}</p> : null}
          </div>
        </div>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><p className="text-xs font-black">پیش‌نمایش زنده</p><p className="text-[10px] text-white/50">قبل از ذخیره، نتیجه را ببینید.</p></div><div className="flex rounded-xl bg-white/10 p-1"><button type="button" onClick={() => setPreview('desktop')} className={preview === 'desktop' ? 'rounded-lg bg-white px-3 py-1.5 text-[10px] font-black text-slate-900' : 'px-3 py-1.5 text-[10px] font-bold text-white/60'}><Monitor className="me-1 inline h-3 w-3" aria-hidden="true" />دسکتاپ</button><button type="button" onClick={() => setPreview('mobile')} className={preview === 'mobile' ? 'rounded-lg bg-white px-3 py-1.5 text-[10px] font-black text-slate-900' : 'px-3 py-1.5 text-[10px] font-bold text-white/60'}><Smartphone className="me-1 inline h-3 w-3" aria-hidden="true" />موبایل</button></div></div>
            <div className={preview === 'desktop' ? 'p-5 sm:p-8' : 'mx-auto max-w-[360px] p-5 sm:p-8'}>
              <div className={preview === 'desktop' ? 'relative aspect-[2.3/1] overflow-hidden rounded-2xl bg-slate-900' : 'relative aspect-[1.6/1] overflow-hidden rounded-2xl bg-slate-900'}>
                {(preview === 'mobile' ? banner.mobileImageUrl || banner.desktopImageUrl : banner.desktopImageUrl) ? <img src={preview === 'mobile' ? (banner.mobileImageUrl || banner.desktopImageUrl) : banner.desktopImageUrl} alt={banner.title || 'پیش‌نمایش بنر'} className="absolute inset-0 h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-white/40">تصویر انتخاب نشده است</div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-right" dir="rtl"><span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black backdrop-blur">Empire</span>{banner.title ? <h4 className="mt-2 text-lg font-black leading-tight">{banner.title}</h4> : null}{banner.subtitle ? <p className="mt-1 line-clamp-2 text-[10px] leading-5 text-white/80">{banner.subtitle}</p> : null}{banner.ctaLabel && banner.href ? <span className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-[10px] font-black text-slate-900">{banner.ctaLabel}</span> : null}</div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-black">بنرهای ثبت‌شده</h3><p className="mt-1 text-[10px] text-slate-400">فعال، اولویت و جایگاه هر بنر را سریع ببینید.</p></div><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300">{banners.length} مورد</span></div><div className="mt-4 space-y-2">{banners.map((item) => <article key={String(item.id)} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800"><div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">{item.desktopImageUrl ? <img src={String(item.desktopImageUrl)} alt="" className="h-full w-full object-cover" /> : null}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><strong className="truncate text-xs font-black">{String(item.title || item.key)}</strong><span className={Boolean(item.isActive) ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700' : 'rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-500'}>{Boolean(item.isActive) ? 'فعال' : 'غیرفعال'}</span></div><p className="mt-1 truncate text-[10px] text-slate-400">{String(item.placement)} · اولویت {String(item.sortOrder ?? 0)}</p></div><button type="button" onClick={() => editBanner(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50" aria-label="ویرایش"><Pencil className="h-3.5 w-3.5" aria-hidden="true" /></button><button type="button" onClick={() => void deleteBanner(String(item.id))} className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50" aria-label="حذف"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button><GripVertical className="h-4 w-4 text-slate-300" aria-hidden="true" /></article>)}</div>{banners.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">هنوز بنری ثبت نشده است.</div> : null}</section>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-indigo-500" aria-hidden="true" /><h2 className="text-lg font-black">تنظیم رتبه‌بندی پیشنهادها</h2></div><p className="mt-1 text-xs leading-6 text-slate-500">وزن‌های الگوریتم پیشنهاد را بدون تغییر کد تنظیم کنید. این بخش را عمداً از تنظیم Banner جدا نگه داشته‌ایم.</p></div><button type="button" onClick={() => void saveWeights()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-black text-white dark:bg-white dark:text-slate-900"><Save className="h-3.5 w-3.5" aria-hidden="true" />ذخیره رتبه‌بندی</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{recommendationKeys.map((key) => <label key={key} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"><span className="block text-[10px] font-black text-slate-500">{key}</span><input type="number" min="0" max="100" step="0.1" value={weights[key] ?? 0} onChange={(event) => setWeights((current) => ({ ...current, [key]: Number(event.target.value) }))} className={inputClass + ' mt-2'} /></label>)}</div></section>
    </div>
  );
}

function ImageUploadCard({ title, value, uploading, required = false, onUpload }: { title: string; value: string; uploading: boolean; required?: boolean; onUpload: (file: File | undefined) => void }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700"><div className="flex items-center justify-between gap-2"><span className="text-xs font-black">{title}</span>{required ? <span className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-black text-rose-600">الزامی</span> : <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-500">اختیاری</span>}</div><div className="mt-3 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">{value ? <img src={value} alt={title} className="h-32 w-full object-cover" /> : <div className="flex h-32 items-center justify-center text-xs text-slate-400">تصویر انتخاب نشده</div>}</div><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => onUpload(event.target.files?.[0])} className="mt-3 block w-full text-xs" disabled={uploading} /><p className="mt-1 text-[10px] text-slate-400">{uploading ? 'در حال آپلود...' : 'JPG، PNG، WEBP یا GIF'}</p></div>;
}

function MegaphoneIcon(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M3 11v2a2 2 0 0 0 2 2h2l7 4V5l-7 4H5a2 2 0 0 0-2 2Z"/><path d="M16 9.5a4 4 0 0 1 0 5"/><path d="M7 15v4"/></svg>;
}
