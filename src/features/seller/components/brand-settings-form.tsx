'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Upload, Store, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface Brand {
  name?: string | null; slug?: string | null; description?: string | null; logoUrl?: string | null; bannerUrl?: string | null;
  website?: string | null; country?: string | null; contactEmail?: string | null; contactPhone?: string | null;
  instagram?: string | null; facebook?: string | null; telegram?: string | null; linkedin?: string | null; attributesJson?: string | null; isActive?: boolean;
}

function ImageUploader({ label, value, onChange, banner = false }: { label: string; value: string; onChange: (v: string) => void; banner?: boolean }) {
  const [busy, setBusy] = React.useState(false);
  const ref = React.useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) return toast.error('فقط فایل تصویری مجاز است؛ ویدیو و فایل غیرتصویری قابل آپلود نیست.');
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) return toast.error('حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/seller/upload', { method: 'POST', body: fd, credentials: 'include' });
      const body = await res.json().catch(() => null);
      if (!res.ok || typeof body?.url !== 'string') return toast.error(body?.error ?? 'آپلود تصویر ناموفق بود.');
      onChange(body.url);
      toast.success('تصویر با موفقیت آپلود شد.');
    } catch {
      toast.error('ارتباط با سرویس آپلود برقرار نشد.');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  }

  return <div className="space-y-2.5"><span className="text-xs font-semibold text-muted-foreground">{label}</span><div className="flex items-start gap-3 rounded-2xl border border-border bg-background/60 p-2.5"><div className={`relative overflow-hidden rounded-xl border border-border bg-muted/20 ${banner ? 'h-24 w-44' : 'h-24 w-24'}`}>{value ? <Image src={value} alt={label} fill unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-7 w-7 text-muted-foreground/60" /></div>}</div><div className="min-w-0 space-y-2.5 pt-0.5"><input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }} /><Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => ref.current?.click()} disabled={busy}><Upload className="h-4 w-4" />{busy ? 'در حال آپلود…' : value ? 'تغییر تصویر' : 'انتخاب تصویر'}</Button><p className="text-[10px] leading-5 text-muted-foreground">تمام فرمت‌های متداول تصویر، حداکثر ۱۰ مگابایت. بعد از انتخاب، آپلود خودکار آغاز می‌شود.</p>{busy ? <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary"><span className="h-1.5 w-14 overflow-hidden rounded-full bg-primary/10"><span className="block h-full w-2/3 animate-pulse rounded-full bg-primary" /></span> آپلود</span> : value ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><CheckCircle2 className="h-3 w-3" /> آماده</span> : null}</div></div></div>;
}

export function BrandSettingsForm() {
  const [brand, setBrand] = React.useState<Brand>({ isActive: true });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    void fetch('/api/seller/brand', { credentials: 'include' }).then((response) => response.json()).then((body) => { if (body?.ok && body.data) setBrand(body.data); }).catch(() => toast.error('بارگذاری برند ناموفق بود.')).finally(() => setLoading(false));
  }, []);

  const set = (key: keyof Brand, value: string | boolean | null) => setBrand((b) => ({ ...b, [key]: value }));
  const text = (key: keyof Brand) => String(brand[key] ?? '');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (text('name').trim().length < 2) return toast.error('نام برند الزامی است.');
    setSaving(true);
    try {
      const res = await fetch('/api/seller/brand', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...brand, name: text('name').trim(), description: text('description') || null }) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) return toast.error(body?.error?.message ?? 'ذخیره برند ناموفق بود.');
      setBrand(body.data);
      toast.success('برند فروشگاه ذخیره شد.');
    } catch { toast.error('ارتباط با سرور برقرار نشد.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-12"><span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  const input = 'h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

  return <form onSubmit={save} className="space-y-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3 border-b border-border pb-4"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Store className="h-5 w-5" /></span><div><h2 className="text-lg font-black">برند اختصاصی فروشگاه</h2><p className="mt-1 text-xs text-muted-foreground">هر فروشگاه دقیقاً یک برند دارد و این برند مستقیماً به حساب فروشنده متصل است.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5"><span className="text-xs font-semibold">نام برند *</span><input className={input} value={text('name')} onChange={(e) => set('name', e.target.value)} maxLength={120} required /></label><label className="space-y-1.5"><span className="text-xs font-semibold">شناسه برند</span><input className={`${input} font-mono text-xs`} dir="ltr" value={text('slug')} disabled placeholder="خودکار" /></label><label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-semibold">معرفی برند</span><textarea className="min-h-28 w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" value={text('description')} onChange={(e) => set('description', e.target.value)} maxLength={1500} /></label></div><div className="grid gap-4 sm:grid-cols-2"><ImageUploader label="لوگوی برند" value={text('logoUrl')} onChange={(v) => set('logoUrl', v)} /><ImageUploader label="بنر برند" banner value={text('bannerUrl')} onChange={(v) => set('bannerUrl', v)} /></div><div className="grid gap-4 sm:grid-cols-2">{([['website','وب‌سایت','url'],['country','کشور','text'],['contactEmail','ایمیل برند','email'],['contactPhone','تلفن برند','tel'],['instagram','اینستاگرام','text'],['facebook','فیسبوک','text'],['telegram','تلگرام','text'],['linkedin','لینکدین','text']] as const).map(([key,label,type]) => <label key={key} className="space-y-1.5"><span className="text-xs font-semibold">{label}</span><input className={input} dir={type === 'text' ? undefined : 'ltr'} type={type} value={text(key)} onChange={(e) => set(key,e.target.value)} /></label>)}</div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={brand.isActive !== false} onChange={(e) => set('isActive', e.target.checked)} /> برند فعال باشد</label><div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره…' : 'ذخیره برند'}</Button></div></form>;
}
