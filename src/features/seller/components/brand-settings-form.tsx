'use client';

import * as React from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { BadgeCheck, CheckCircle2, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { optimizeImage, uploadImageWithProgress, formatBytes } from '@/lib/media/client-image-upload';

interface Brand { id?: string; name?: string|null; slug?: string|null; description?: string|null; logoUrl?: string|null; bannerUrl?: string|null; isActive?: boolean }

async function uploadImage(file: File, purpose: 'logo' | 'banner', onProgress: (value: number) => void) {
  const optimized = await optimizeImage(file, purpose);
  const uploaded = await uploadImageWithProgress('/api/seller/upload', optimized.file, onProgress);
  return { url: uploaded.url, saved: Math.max(0, optimized.originalBytes - optimized.optimizedBytes), bytes: optimized.optimizedBytes };
}

export function BrandSettingsForm() {
  const [brand, setBrand] = React.useState<Brand>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState<'logo'|'banner'|null>(null);
  const [progress, setProgress] = React.useState(0);
  const logoRef = React.useRef<HTMLInputElement>(null);
  const bannerRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    void fetch('/api/seller/brand', { credentials: 'include', cache: 'no-store' })
      .then(async (r) => { const body = await r.json(); if (!r.ok || !body?.ok) throw new Error(body?.error?.message ?? 'brand_load_failed'); return body; })
      .then((body) => { if (body.data) setBrand(body.data); })
      .catch(() => toast.error('بارگذاری برند ناموفق بود.'))
      .finally(() => setLoading(false));
  }, []);

  async function choose(kind: 'logo'|'banner', file?: File) {
    if (!file) return;
    setUploading(kind); setProgress(0);
    try {
      const result = await uploadImage(file, kind, setProgress);
      setBrand((current) => ({ ...current, [kind === 'logo' ? 'logoUrl' : 'bannerUrl']: result.url }));
      toast.success(`${kind === 'logo' ? 'لوگو' : 'بنر'} آماده شد؛ ${formatBytes(result.bytes)} ارسال شد.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'آپلود ناموفق بود.'); }
    finally { setUploading(null); setProgress(0); if (kind === 'logo' && logoRef.current) logoRef.current.value = ''; if (kind === 'banner' && bannerRef.current) bannerRef.current.value = ''; }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const name = String(brand.name ?? '').trim();
    if (!name) return toast.error('نام برند الزامی است.');
    setSaving(true);
    try {
      const payload = { name, description: String(brand.description ?? '').trim() || null, logoUrl: brand.logoUrl || null, bannerUrl: brand.bannerUrl || null, isActive: brand.isActive !== false };
      const res = await fetch('/api/seller/brand', { method: brand.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) throw new Error(body?.error?.message ?? 'ذخیره برند ناموفق بود.');
      setBrand(body.data); toast.success(brand.id ? 'برند با موفقیت ذخیره شد.' : 'برند با موفقیت ساخته شد.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'ذخیره ناموفق بود.'); }
    finally { setSaving(false); }
  }

  async function deactivate() {
    if (!brand.id || !window.confirm('برند غیرفعال شود؟ محصولات و سفارش‌های قبلی حذف نمی‌شوند.')) return;
    setSaving(true);
    try {
      const res = await fetch('/api/seller/brand', { method: 'DELETE', credentials: 'include' });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) throw new Error(body?.error?.message ?? 'غیرفعال‌سازی برند ناموفق بود.');
      setBrand((current) => ({ ...current, isActive: false })); toast.success('برند غیرفعال شد.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'غیرفعال‌سازی ناموفق بود.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  return <form onSubmit={save} className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7" dir="rtl">
    <header className="mb-6 flex items-center gap-3 border-b border-border pb-5"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BadgeCheck className="h-6 w-6" /></div><div><h1 className="text-xl font-black">برند من</h1><p className="mt-1 text-xs text-muted-foreground">برند فقط با ذخیره صریح شما ساخته می‌شود؛ تصویرها قبل از ارسال در مرورگر کوچک می‌شوند.</p></div></header>
    {uploading && <div className="mb-5 space-y-1"><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div><p className="text-[11px] text-muted-foreground">آپلود {uploading === 'logo' ? 'لوگو' : 'بنر'}: {progress}%</p></div>}
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-muted/20 p-4"><div className="flex flex-col gap-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><MediaPreview label="لوگوی برند" value={brand.logoUrl ?? ''} aspect="logo" /><div><input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void choose('logo', f); }} /><Button type="button" variant="outline" className="rounded-xl" onClick={() => logoRef.current?.click()} disabled={uploading !== null}><Upload className="h-4 w-4" />{uploading === 'logo' ? 'در حال آپلود…' : brand.logoUrl ? 'تغییر لوگو' : 'انتخاب لوگو'}</Button>{brand.logoUrl && uploading !== 'logo' ? <span className="mr-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />آماده است</span> : null}</div></div><div className="overflow-hidden rounded-2xl border border-border bg-background"><MediaPreview label="بنر برند" value={brand.bannerUrl ?? ''} aspect="banner" /><div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3"><p className="text-xs text-muted-foreground">تصویر عریض سربرگ برند عمومی</p><div><input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void choose('banner', f); }} /><Button type="button" variant="outline" className="rounded-xl" onClick={() => bannerRef.current?.click()} disabled={uploading !== null}><Upload className="h-4 w-4" />{uploading === 'banner' ? 'در حال آپلود…' : brand.bannerUrl ? 'تغییر بنر' : 'انتخاب بنر'}</Button></div></div></div></section>
      <label className="block space-y-2"><span className="text-xs font-bold">نام برند *</span><input value={String(brand.name ?? '')} onChange={(e) => setBrand((b) => ({ ...b, name: e.target.value }))} maxLength={120} required className="h-11 w-full rounded-2xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
      <label className="block space-y-2"><span className="text-xs font-bold">شناسه برند</span><input value={String(brand.slug ?? '')} disabled dir="ltr" className="h-11 w-full rounded-2xl border border-input bg-muted/40 px-3.5 font-mono text-xs text-muted-foreground" /></label>
      <label className="block space-y-2"><span className="text-xs font-bold">معرفی کوتاه برند</span><textarea value={String(brand.description ?? '')} onChange={(e) => setBrand((b) => ({ ...b, description: e.target.value }))} maxLength={1500} rows={4} className="w-full rounded-2xl border border-input bg-background p-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={brand.isActive !== false} onChange={(e) => setBrand((b) => ({ ...b, isActive: e.target.checked }))} /> برند فعال باشد</label>
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4"><Button type="button" variant="outline" className="text-destructive" onClick={() => void deactivate()} disabled={saving || !brand.id || brand.isActive === false}><Trash2 className="h-4 w-4" />غیرفعال‌کردن برند</Button><Button type="submit" disabled={saving || uploading !== null}>{saving ? 'در حال ذخیره…' : brand.id ? 'ذخیره برند' : 'ساخت برند'}</Button></div>
    </div>
  </form>;
}

function MediaPreview({ label, value, aspect }: { label: string; value: string; aspect: 'logo'|'banner' }) {
  return <div className={`relative overflow-hidden rounded-2xl border border-border bg-background ${aspect === 'banner' ? 'aspect-[3/1] w-full' : 'h-24 w-24'}`}>{value ? <Image src={value} alt={label} fill unoptimized className="object-cover" sizes={aspect === 'banner' ? '100vw' : '96px'} /> : <div className="flex h-full w-full items-center justify-center"><ImageIcon className="h-7 w-7 text-muted-foreground" /></div>}</div>;
}
