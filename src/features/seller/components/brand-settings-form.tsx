'use client';

import * as React from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { BadgeCheck, CheckCircle2, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Brand { id?: string; name?: string | null; slug?: string | null; description?: string | null; logoUrl?: string | null; isActive?: boolean; }

export function BrandSettingsForm() {
  const [brand, setBrand] = React.useState<Brand>({ isActive: true });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    void fetch('/api/seller/brand', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((body) => { if (body?.ok && body.data) setBrand(body.data); else throw new Error('brand_load_failed'); })
      .catch(() => toast.error('بارگذاری برند ناموفق بود.'))
      .finally(() => setLoading(false));
  }, []);

  async function upload(file: File) {
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) return toast.error('حجم تصویر باید بین ۱ بایت تا ۱۰ مگابایت باشد.');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/seller/upload', { method: 'POST', body: fd, credentials: 'include' });
      const body = await res.json().catch(() => null);
      if (!res.ok || typeof body?.url !== 'string') throw new Error(body?.error ?? 'آپلود تصویر ناموفق بود.');
      setBrand((b) => ({ ...b, logoUrl: body.url }));
      toast.success('عکس برند آپلود شد.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'آپلود ناموفق بود.'); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ''; }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!String(brand.name ?? '').trim()) return toast.error('نام برند الزامی است.');
    setSaving(true);
    try {
      const res = await fetch('/api/seller/brand', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name: String(brand.name).trim(), description: String(brand.description ?? '').trim() || null, logoUrl: brand.logoUrl || null, isActive: brand.isActive !== false }) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) throw new Error(body?.error?.message ?? 'ذخیره برند ناموفق بود.');
      setBrand(body.data);
      toast.success('برند با موفقیت ذخیره شد.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'ذخیره ناموفق بود.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  return <form onSubmit={save} className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7" dir="rtl">
    <header className="mb-6 flex items-center gap-3 border-b border-border pb-5"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BadgeCheck className="h-6 w-6" /></div><div><h1 className="text-xl font-black">برند من</h1><p className="mt-1 text-xs text-muted-foreground">هر فروشنده فقط یک برند دارد. اینجا فقط اطلاعات ساده و عکس پروفایل برند را مدیریت کنید.</p></div></header>
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-muted/20 p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border border-border bg-background">{brand.logoUrl ? <Image src={brand.logoUrl} alt={String(brand.name ?? 'برند')} fill unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>}</div><div className="min-w-0 space-y-2"><input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }} /><Button type="button" variant="outline" className="rounded-xl" onClick={() => inputRef.current?.click()} disabled={uploading}><Upload className="h-4 w-4" />{uploading ? 'در حال آپلود…' : brand.logoUrl ? 'تغییر عکس پروفایل' : 'انتخاب عکس پروفایل'}</Button><p className="text-xs text-muted-foreground">نام و پسوند فایل مهم نیست؛ پس از انتخاب، آپلود خودکار انجام می‌شود.</p>{brand.logoUrl && !uploading && <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />عکس آماده است</span>}</div></div></section>
      <label className="block space-y-2"><span className="text-xs font-bold">نام برند *</span><input value={String(brand.name ?? '')} onChange={(e) => setBrand((b) => ({ ...b, name: e.target.value }))} maxLength={120} required className="h-11 w-full rounded-2xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
      <label className="block space-y-2"><span className="text-xs font-bold">شناسه برند</span><input value={String(brand.slug ?? '')} disabled dir="ltr" className="h-11 w-full rounded-2xl border border-input bg-muted/40 px-3.5 font-mono text-xs text-muted-foreground" /></label>
      <label className="block space-y-2"><span className="text-xs font-bold">معرفی کوتاه برند</span><textarea value={String(brand.description ?? '')} onChange={(e) => setBrand((b) => ({ ...b, description: e.target.value }))} maxLength={1500} rows={5} className="w-full rounded-2xl border border-input bg-background p-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="یک معرفی کوتاه برای برندتان…" /></label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={brand.isActive !== false} onChange={(e) => setBrand((b) => ({ ...b, isActive: e.target.checked }))} /> برند فعال باشد</label>
      <div className="flex justify-end border-t border-border pt-4"><Button type="submit" disabled={saving}>{saving ? 'در حال ذخیره…' : 'ذخیره برند'}</Button></div>
    </div>
  </form>;
}
