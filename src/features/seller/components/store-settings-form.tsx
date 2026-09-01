'use client';

import * as React from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { optimizeImage, uploadImageWithProgress, formatBytes } from '@/lib/media/client-image-upload';
import { Landmark, Link2, Loader2, MapPin, Save, ShieldCheck, Store, Upload, Wallet } from 'lucide-react';

interface StoreSettings {
  sellerShopName: string;
  sellerBio: string;
  sellerLogoUrl: string;
  sellerBannerUrl: string;
  sellerWhatsapp: string;
  sellerContactEmail: string;
  sellerContactPhone: string;
  sellerAddress: string;
  sellerCity: string;
  sellerCountry: string;
  sellerBankAccountNumber: string;
  sellerBankAccountName: string;
  sellerBankName: string;
  sellerAtomaPay: string;
  sellerInstagram: string;
  sellerTelegram: string;
  sellerFacebook: string;
  sellerLinkedin: string;
  sellerWebsite: string;
}

type MediaField = 'sellerLogoUrl' | 'sellerBannerUrl';

const EMPTY: StoreSettings = {
  sellerShopName: '', sellerBio: '', sellerLogoUrl: '', sellerBannerUrl: '', sellerWhatsapp: '',
  sellerContactEmail: '', sellerContactPhone: '', sellerAddress: '', sellerCity: '', sellerCountry: '',
  sellerBankAccountNumber: '', sellerBankAccountName: '', sellerBankName: '', sellerAtomaPay: '',
  sellerInstagram: '', sellerTelegram: '', sellerFacebook: '', sellerLinkedin: '', sellerWebsite: '',
};

function Field({ label, value, onChange, type = 'text', dir, placeholder, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; dir?: 'ltr' | 'rtl'; placeholder?: string; multiline?: boolean;
}) {
  const cls = 'w-full rounded-2xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';
  return <label className="block space-y-2"><span className="text-xs font-bold text-foreground">{label}</span>{multiline ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} placeholder={placeholder} dir={dir} className={cls} /> : <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} dir={dir} className={cls} />}</label>;
}

function Section({ icon: Icon, title, description, children }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"><header className="mb-5 flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><div><h2 className="text-base font-black">{title}</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">{description}</p></div></header>{children}</section>;
}

function MediaCard({ label, value, field, hint, onUploaded, persist, busy }: { label: string; value: string; field: MediaField; hint: string; onUploaded: (value: string) => void; persist: (field: MediaField, value: string) => Promise<void>; busy: boolean }) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [drag, setDrag] = React.useState(false);

  async function upload(file?: File) {
    if (!file || uploading || busy) return;
    if (!file.type.startsWith('image/')) return toast.error('فقط فایل تصویری مجاز است.');
    if (file.size > 10 * 1024 * 1024) return toast.error('حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.');
    setUploading(true); setProgress(0);
    try {
      const optimized = await optimizeImage(file, field === 'sellerLogoUrl' ? 'logo' : 'banner');
      const result = await uploadImageWithProgress('/api/seller/upload', optimized.file, setProgress);
      onUploaded(result.url);
      await persist(field, result.url);
      toast.success(`${label} آپلود و ذخیره شد (${formatBytes(result.size)}).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'آپلود یا ذخیره تصویر ناموفق بود.');
    } finally {
      setUploading(false); setProgress(0); if (ref.current) ref.current.value = '';
    }
  }

  return <div className={`rounded-2xl border p-4 transition ${drag ? 'border-primary bg-primary/5' : 'border-border bg-background'}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); void upload(e.dataTransfer.files?.[0]); }}><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className={`${field === 'sellerBannerUrl' ? 'h-28 w-full sm:w-56' : 'h-24 w-24'} relative shrink-0 overflow-hidden rounded-2xl border border-border bg-muted/30`}>{value ? <Image src={value} alt={label} fill unoptimized className="object-cover" sizes="224px" /> : <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Store className="h-7 w-7" /></div>}</div><div className="min-w-0 flex-1"><p className="text-sm font-black">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>{uploading ? <div className="mt-3"><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-1 text-[11px] text-muted-foreground">در حال آپلود: {progress}%</p></div> : <div className="mt-3 flex flex-wrap items-center gap-2"><input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} /><Button type="button" variant="outline" className="rounded-xl" disabled={uploading || busy} onClick={() => ref.current?.click()}><Upload className="h-4 w-4" />{value ? 'تغییر تصویر' : 'آپلود تصویر'}</Button>{value ? <span className="text-xs font-bold text-emerald-600">ذخیره‌شده</span> : null}</div>}</div></div></div>;
}

export function StoreSettingsForm() {
  const [values, setValues] = React.useState<StoreSettings>(EMPTY);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/seller/settings', { credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' } });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.ok) throw new Error(body?.error?.message ?? 'خطا در دریافت تنظیمات فروشگاه');
        if (active) setValues({ ...EMPTY, ...body.data });
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'خطا در دریافت تنظیمات فروشگاه');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => setValues((current) => ({ ...current, [key]: value }));
  const persistMedia = async (field: MediaField, value: string) => {
    const res = await fetch('/api/seller/settings', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ [field]: value }) });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok) throw new Error(body?.error?.message ?? 'تصویر در فروشگاه ذخیره نشد.');
    setValues((current) => ({ ...current, ...body.data }));
  };

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (values.sellerShopName.trim().length < 2) return toast.error('نام فروشگاه حداقل ۲ حرف باشد.');
    if (values.sellerContactEmail && !/^\S+@\S+\.\S+$/.test(values.sellerContactEmail.trim())) return toast.error('ایمیل تماس معتبر نیست.');
    setSaving(true); setError(null);
    try {
      const payload = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === 'string' && !value.trim() ? null : value]));
      const res = await fetch('/api/seller/settings', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) throw new Error(body?.error?.message ?? 'ذخیره تنظیمات فروشگاه ناموفق بود.');
      setValues({ ...EMPTY, ...body.data }); setSavedAt(new Date()); toast.success('تمام تنظیمات فروشگاه با موفقیت ذخیره شد.');
    } catch (e) { const message = e instanceof Error ? e.message : 'ذخیره ناموفق بود.'; setError(message); toast.error(message); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="rounded-3xl border border-border bg-card py-20 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /></div>;
  if (error && !values.sellerShopName && !values.sellerContactEmail) return <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 text-center"><p className="text-sm font-bold text-destructive">{error}</p><Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => window.location.reload()}>تلاش دوباره</Button></div>;

  const v = (key: keyof StoreSettings) => values[key] ?? '';
  return <form onSubmit={save} className="space-y-5" dir="rtl">
    <Section icon={Store} title="هویت و ویترین فروشگاه" description="این اطلاعات مستقیماً روی صفحه عمومی فروشگاه نمایش داده می‌شوند.">
      <div className="grid gap-4"><Field label="نام فروشگاه" value={v('sellerShopName')} onChange={(x) => update('sellerShopName', x)} placeholder="مثلاً فروشگاه احمد" /><Field label="معرفی فروشگاه" value={v('sellerBio')} onChange={(x) => update('sellerBio', x)} multiline placeholder="توضیح کوتاه درباره تخصص و محصولات فروشگاه…" /></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2"><MediaCard label="لوگوی فروشگاه" value={v('sellerLogoUrl')} field="sellerLogoUrl" hint="مربع؛ PNG/JPG/WebP؛ حداکثر ۱۰MB. بعد از upload فوراً در DB ذخیره می‌شود." onUploaded={(x) => update('sellerLogoUrl', x)} persist={persistMedia} busy={saving} /><MediaCard label="بنر فروشگاه" value={v('sellerBannerUrl')} field="sellerBannerUrl" hint="بنر عریض؛ PNG/JPG/WebP؛ حداکثر ۱۰MB. بعد از upload فوراً در DB ذخیره می‌شود." onUploaded={(x) => update('sellerBannerUrl', x)} persist={persistMedia} busy={saving} /></div>
    </Section>

    <Section icon={MapPin} title="تماس و موقعیت" description="راه‌های تماس عمومی و آدرس فروشگاه."><div className="grid gap-4 sm:grid-cols-2"><Field label="تلفن تماس" value={v('sellerContactPhone')} onChange={(x) => update('sellerContactPhone', x)} type="tel" dir="ltr" placeholder="+937..." /><Field label="واتساپ" value={v('sellerWhatsapp')} onChange={(x) => update('sellerWhatsapp', x)} type="tel" dir="ltr" placeholder="+937..." /><Field label="ایمیل تماس" value={v('sellerContactEmail')} onChange={(x) => update('sellerContactEmail', x)} type="email" dir="ltr" placeholder="shop@example.com" /><Field label="کشور" value={v('sellerCountry')} onChange={(x) => update('sellerCountry', x)} placeholder="افغانستان" /><Field label="شهر" value={v('sellerCity')} onChange={(x) => update('sellerCity', x)} placeholder="کابل" /><Field label="آدرس کامل" value={v('sellerAddress')} onChange={(x) => update('sellerAddress', x)} multiline placeholder="آدرس فروشگاه/انبار…" /></div></Section>

    <Section icon={Link2} title="شبکه‌های اجتماعی و وب" description="لینک‌های معتبر ارتباطی را وارد کنید؛ دامنه وب‌سایت باید با http/https باشد."><div className="grid gap-4 sm:grid-cols-2"><Field label="Instagram" value={v('sellerInstagram')} onChange={(x) => update('sellerInstagram', x)} dir="ltr" placeholder="https://instagram.com/..." /><Field label="Telegram" value={v('sellerTelegram')} onChange={(x) => update('sellerTelegram', x)} dir="ltr" placeholder="@channel یا https://t.me/..." /><Field label="Facebook" value={v('sellerFacebook')} onChange={(x) => update('sellerFacebook', x)} dir="ltr" placeholder="https://facebook.com/..." /><Field label="LinkedIn" value={v('sellerLinkedin')} onChange={(x) => update('sellerLinkedin', x)} dir="ltr" placeholder="https://linkedin.com/..." /><Field label="Website" value={v('sellerWebsite')} onChange={(x) => update('sellerWebsite', x)} type="url" dir="ltr" placeholder="https://example.com" /></div></Section>

    <Section icon={Wallet} title="حساب‌های دریافت و تسویه" description="این اطلاعات فقط برای عملیات تسویه فروشنده استفاده می‌شوند."><div className="grid gap-4 sm:grid-cols-2"><Field label="نام صاحب حساب" value={v('sellerBankAccountName')} onChange={(x) => update('sellerBankAccountName', x)} /><Field label="نام بانک" value={v('sellerBankName')} onChange={(x) => update('sellerBankName', x)} /><Field label="شماره حساب" value={v('sellerBankAccountNumber')} onChange={(x) => update('sellerBankAccountNumber', x)} dir="ltr" /><Field label="ATOMA Pay" value={v('sellerAtomaPay')} onChange={(x) => update('sellerAtomaPay', x)} dir="ltr" /></div></Section>

    <div className="sticky bottom-3 z-20 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-600" />{savedAt ? `آخرین ذخیره: ${savedAt.toLocaleTimeString('fa-AF')}` : 'تغییرات شما تا زمان ذخیره فقط در همین صفحه هستند.'}</div><Button type="submit" disabled={saving} className="min-w-40 rounded-xl"><Save className="h-4 w-4" />{saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات فروشگاه'}</Button></div></div>
  </form>;
}
