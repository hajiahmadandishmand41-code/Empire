'use client';

import * as React from 'react';
import Image from 'next/image';
import { BadgeCheck, Image as ImageIcon, Upload, Trash2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Brand { id?: string; name: string; slug?: string|null; description?: string|null; logoUrl?: string|null; bannerUrl?: string|null; isActive: boolean }

async function uploadImage(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('فقط فایل تصویری مجاز است.');
  if (file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error('حجم تصویر باید حداکثر ۱۰ مگابایت باشد.');
  const fd = new FormData(); fd.append('file', file);
  const res = await fetch('/api/seller/upload', { method: 'POST', body: fd, credentials: 'include' });
  const body = await res.json().catch(() => null);
  if (!res.ok || typeof body?.url !== 'string') throw new Error(body?.error?.message ?? body?.error ?? 'آپلود تصویر ناموفق بود.');
  return String(body.url);
}

export function BrandSettingsForm() {
  const [brand, setBrand] = React.useState<Brand|null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState<'logo'|'banner'|null>(null);
  const logoRef = React.useRef<HTMLInputElement>(null);
  const bannerRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    let alive = true;
    void fetch('/api/seller/brand', { credentials: 'include', cache: 'no-store' })
      .then(async (r) => { const body = await r.json().catch(() => null); if (!r.ok) throw new Error(body?.error?.message ?? 'بارگذاری برند ناموفق بود.'); return body; })
      .then((body) => { if (!alive) return; setBrand(body?.data ? { ...body.data, isActive: body.data.isActive !== false, name: String(body.data.name ?? '') } : null); })
      .catch((e) => { if (alive) window.dispatchEvent(new CustomEvent('seller-toast-error', { detail: e instanceof Error ? e.message : 'بارگذاری برند ناموفق بود.' })); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  async function selectImage(kind: 'logo'|'banner', file?: File) {
    if (!file) return;
    setUploading(kind);
    try {
      const url = await uploadImage(file);
      setBrand((b) => ({ ...(b ?? { name: '', isActive: true }), [kind === 'logo' ? 'logoUrl' : 'bannerUrl']: url }));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'آپلود ناموفق بود.');
    } finally {
      setUploading(null);
      if (kind === 'logo' && logoRef.current) logoRef.current.value = '';
      if (kind === 'banner' && bannerRef.current) bannerRef.current.value = '';
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const name = String(brand?.name ?? '').trim();
    if (name.length < 2) return alert('نام برند حداقل ۲ حرف باشد.');
    setBusy(true);
    try {
      const payload = { name, description: brand?.description?.trim() || null, logoUrl: brand?.logoUrl || null, bannerUrl: brand?.bannerUrl || null, isActive: brand?.isActive !== false };
      const res = await fetch('/api/seller/brand', { method: brand?.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) throw new Error(body?.error?.message ?? 'ذخیره برند ناموفق بود.');
      setBrand(body.data); alert(brand?.id ? 'برند به‌روزرسانی شد.' : 'برند با موفقیت ساخته شد.');
    } catch (e) { alert(e instanceof Error ? e.message : 'ذخیره ناموفق بود.'); }
    finally { setBusy(false); }
  }

  async function deactivate() {
    if (!brand?.id || !confirm('برند غیرفعال شود؟ محصولات حذف نمی‌شوند و فقط ارتباط برند برداشته می‌شود.')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/seller/brand', { method: 'DELETE', credentials: 'include' });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) throw new Error(body?.error?.message ?? 'غیرفعال‌سازی ناموفق بود.');
      setBrand((b) => b ? { ...b, isActive: false } : null);
      alert('برند غیرفعال شد.');
    } catch (e) { alert(e instanceof Error ? e.message : 'غیرفعال‌سازی ناموفق بود.'); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7" dir="rtl">
      <header className="mb-6 flex items-center gap-3 border-b border-border pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BadgeCheck className="h-6 w-6" /></div>
        <div><h1 className="text-xl font-black">برند اختصاصی</h1><p className="mt-1 text-xs text-muted-foreground">برند از فروشگاه جداست و فقط با اقدام صریح شما ساخته می‌شود.</p></div>
      </header>
      {!brand && <div className="mb-5 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm leading-7">هنوز برند اختصاصی ندارید. نام برند، لوگو و بنر را ثبت کنید؛ محصول‌ها بعداً به‌صورت اختیاری به این برند متصل می‌شوند.</div>}
      <div className="space-y-5">
        <label className="block space-y-2"><span className="text-xs font-bold">نام برند *</span><input value={brand?.name ?? ''} onChange={(e) => setBrand((b) => ({ ...(b ?? { isActive: true }), name: e.target.value }))} maxLength={120} className="h-11 w-full rounded-2xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" required /></label>
        {brand?.slug && <label className="block space-y-2"><span className="text-xs font-bold">شناسه عمومی</span><input value={brand.slug} disabled dir="ltr" className="h-11 w-full rounded-2xl border border-input bg-muted/40 px-3.5 font-mono text-xs text-muted-foreground" /></label>}
        <label className="block space-y-2"><span className="text-xs font-bold">معرفی برند</span><textarea value={brand?.description ?? ''} onChange={(e) => setBrand((b) => ({ ...(b ?? { name: '', isActive: true }), description: e.target.value }))} maxLength={1500} rows={4} className="w-full rounded-2xl border border-input bg-background p-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
        <MediaField label="لوگوی برند" value={brand?.logoUrl ?? ''} inputRef={logoRef} uploading={uploading === 'logo'} onPick={(f) => void selectImage('logo', f)} />
        <MediaField label="بنر برند" value={brand?.bannerUrl ?? ''} inputRef={bannerRef} uploading={uploading === 'banner'} onPick={(f) => void selectImage('banner', f)} banner />
        {brand?.id && <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-4 text-sm font-bold"><input type="checkbox" checked={brand.isActive} onChange={(e) => setBrand({ ...brand, isActive: e.target.checked })} className="h-5 w-5" />برند در صفحه عمومی فعال باشد.</label>}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          {brand?.id ? <Button type="button" variant="outline" className="text-destructive" onClick={() => void deactivate()} disabled={busy || !brand.isActive}><Trash2 className="h-4 w-4" />غیرفعال‌کردن</Button> : <span />}
          <Button type="submit" disabled={busy || uploading !== null}><PlusCircle className="h-4 w-4" />{busy ? 'در حال ذخیره…' : brand?.id ? 'ذخیره برند' : 'ایجاد برند'}</Button>
        </div>
      </div>
    </form>
  );
}

function MediaField({ label, value, inputRef, uploading, onPick, banner = false }: { label: string; value: string; inputRef: React.RefObject<HTMLInputElement | null>; uploading: boolean; onPick: (file?: File) => void; banner?: boolean }) {
  return <section className="rounded-2xl border border-border bg-muted/20 p-4"><div className="mb-3 text-xs font-bold">{label}</div><div className="flex flex-col gap-3 sm:flex-row sm:items-start"><div className={`relative overflow-hidden rounded-2xl border border-border bg-background ${banner ? 'aspect-[3/1] w-full sm:w-80' : 'h-24 w-24'}`}>{value ? <Image src={value} alt={label} fill unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-7 w-7 text-muted-foreground" /></div>}</div><div><input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} /><Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}><Upload className="h-4 w-4" />{uploading ? 'در حال آپلود…' : value ? 'تغییر تصویر' : 'انتخاب تصویر'}</Button><p className="mt-2 text-[11px] leading-5 text-muted-foreground">PNG/JPG/WebP — حداکثر ۱۰ مگابایت</p></div></div></section>;
}
