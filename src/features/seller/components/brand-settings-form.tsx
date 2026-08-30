'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Upload, Store } from 'lucide-react';
import Image from 'next/image';

interface Brand { name?: string | null; slug?: string | null; description?: string | null; logoUrl?: string | null; bannerUrl?: string | null; website?: string | null; country?: string | null; contactEmail?: string | null; contactPhone?: string | null; instagram?: string | null; facebook?: string | null; telegram?: string | null; linkedin?: string | null; attributesJson?: string | null; isActive?: boolean; }

function ImageUploader({ label, value, onChange, banner = false }: { label: string; value: string; onChange: (v: string) => void; banner?: boolean }) {
  const [busy, setBusy] = React.useState(false);
  const ref = React.useRef<HTMLInputElement>(null);
  async function upload(file: File) {
    if (!file.type.startsWith('image/')) return toast.error('فقط فایل تصویر مجاز است');
    if (file.size <= 0 || file.size > 20 * 1024 * 1024) return toast.error('حجم تصویر نباید بیشتر از ۲۰ مگابایت باشد');
    setBusy(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/seller/upload', { method: 'POST', body: fd, credentials: 'include' });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.url) return toast.error(body?.error ?? 'آپلود تصویر ناموفق بود');
      onChange(body.url); toast.success('تصویر آماده شد');
    } catch { toast.error('خطا در اتصال به سرور'); }
    finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  }
  return <div className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">{label}</span><div className="flex items-start gap-3"><div className={`relative overflow-hidden rounded-xl border border-border bg-muted/20 ${banner ? 'h-20 w-40' : 'h-20 w-20'}`}>{value ? <Image src={value} alt={label} fill unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground" /></div>}</div><div className="space-y-2"><input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} /><Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={busy}><Upload className="h-4 w-4" />{busy ? 'در حال آپلود…' : value ? 'تغییر تصویر' : 'آپلود تصویر'}</Button><p className="text-[11px] text-muted-foreground">همهٔ فرمت‌های تصویری پشتیبانی‌شده، حداکثر ۲۰ مگابایت</p></div></div></div>;
}

export function BrandSettingsForm() {
  const [brand, setBrand] = React.useState<Brand>({ isActive: true });
  const [loading, setLoading] = React.useState(true); const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { fetch('/api/seller/brand', { credentials: 'include' }).then((r) => r.json()).then((body) => { if (body?.ok && body.data) setBrand(body.data); }).catch(() => toast.error('بارگذاری برند ناموفق بود')).finally(() => setLoading(false)); }, []);
  const set = (key: keyof Brand, value: string | boolean | null) => setBrand((b) => ({ ...b, [key]: value }));
  const text = (key: keyof Brand) => String(brand[key] ?? '');
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (text('name').trim().length < 2) return toast.error('نام برند الزامی است'); setSaving(true);
    try {
      const res = await fetch('/api/seller/brand', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...brand, name: text('name').trim(), slug: undefined, description: text('description') || null }) });
      const body = await res.json().catch(() => null); if (!res.ok || !body?.ok) return toast.error(body?.error?.message ?? 'ذخیره برند ناموفق بود'); setBrand(body.data); toast.success('برند فروشگاه ذخیره شد');
    } catch { toast.error('خطا در اتصال به سرور'); } finally { setSaving(false); }
  }
  if (loading) return <div className="flex justify-center py-12"><span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  const input = 'h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
  return <form onSubmit={save} className="space-y-6 rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3 border-b border-border pb-4"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Store className="h-5 w-5" /></div><div><h2 className="font-black">برند اختصاصی فروشگاه</h2><p className="text-xs text-muted-foreground">هر فروشگاه دقیقاً یک برند دارد و نام فنی برند خودکار مدیریت می‌شود.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-semibold">نام برند *</span><input className={input} value={text('name')} onChange={(e) => set('name', e.target.value)} maxLength={120} required /></label><label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-semibold">معرفی برند</span><textarea className="min-h-28 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary" value={text('description')} onChange={(e) => set('description', e.target.value)} maxLength={1500} /></label></div><div className="grid gap-5 sm:grid-cols-2"><ImageUploader label="لوگوی برند" value={text('logoUrl')} onChange={(v) => set('logoUrl', v)} /><ImageUploader label="بنر برند" banner value={text('bannerUrl')} onChange={(v) => set('bannerUrl', v)} /></div><div className="grid gap-4 sm:grid-cols-2">{([['website','وب‌سایت','url'],['country','کشور','text'],['contactEmail','ایمیل برند','email'],['contactPhone','تلفن برند','tel'],['instagram','اینستاگرام','url'],['facebook','فیسبوک','url'],['telegram','تلگرام','url'],['linkedin','لینکدین','url']] as const).map(([key,label,type]) => <label key={key} className="space-y-1.5"><span className="text-xs font-semibold">{label}</span><input className={input} dir={type === 'url' || type === 'email' || type === 'tel' ? 'ltr' : undefined} type={type} value={text(key)} onChange={(e) => set(key, e.target.value)} /></label>)}</div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={brand.isActive !== false} onChange={(e) => set('isActive', e.target.checked)} /> برند فعال باشد</label><div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره…' : 'ذخیره برند'}</Button></div></form>;
}
