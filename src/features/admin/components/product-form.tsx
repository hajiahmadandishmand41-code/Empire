'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, ImagePlus, Package, Tag, Truck, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CategoryOption { id: string; name: string }
export interface AdminProductFormValue {
  id?: string; slug: string; name: string; shortDescription: string; description: string; price: number;
  currency: string; categoryId: string; region: string; badge: string; inStock: boolean;
  imagesJson?: string[]; primaryImageIndex?: number;
}

interface ProductFormProps {
  locale: string; categories: CategoryOption[]; initial?: AdminProductFormValue;
  labels: { createTitle: string; editTitle: string; name: string; slug: string; shortDescription: string; description: string; price: string; currency: string; category: string; region: string; badge: string; inStock: string; save: string; create: string; back: string; required: string; success: string; error: string; cancel: string; };
}

const MAX_IMAGES = 12;
const ACCEPTED_IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ProductForm({ locale, categories, initial, labels }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [form, setForm] = React.useState<AdminProductFormValue>(initial ?? { slug: '', name: '', shortDescription: '', description: '', price: 0, currency: 'AFN', categoryId: categories[0]?.id ?? '', region: '', badge: '', inStock: true, imagesJson: [], primaryImageIndex: 0 });
  const images = form.imagesJson ?? [];
  const primaryIndex = Math.min(Math.max(form.primaryImageIndex ?? 0, 0), Math.max(images.length - 1, 0));

  function update<K extends keyof AdminProductFormValue>(key: K, value: AdminProductFormValue[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function requiredText(value: string) { return value.trim().length >= 1; }

  async function uploadImages(files: FileList | null) {
    if (!files?.length || uploading) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { toast.error(`حداکثر ${MAX_IMAGES} تصویر قابل ثبت است.`); return; }
    const selected = Array.from(files).slice(0, remaining);
    const invalid = selected.find((file) => !ACCEPTED_IMAGES.includes(file.type) || file.size <= 0 || file.size > 10 * 1024 * 1024);
    if (invalid) { toast.error('هر تصویر باید JPG، PNG، WEBP یا GIF و حداکثر ۱۰ مگابایت باشد.'); return; }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        const fd = new FormData(); fd.set('file', file);
        const response = await fetch('/api/admin/media', { method: 'POST', body: fd });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.ok || !body?.data?.url) throw new Error(body?.error?.message ?? 'upload_failed');
        uploaded.push(body.data.url);
      }
      setForm((current) => ({ ...current, imagesJson: [...(current.imagesJson ?? []), ...uploaded], primaryImageIndex: (current.imagesJson?.length ?? 0) > 0 ? (current.primaryImageIndex ?? 0) : 0 }));
      toast.success(`${uploaded.length} تصویر آپلود شد.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'آپلود تصویر ناموفق بود.'); }
    finally { setUploading(false); }
  }

  function removeImage(index: number) {
    setForm((current) => {
      const next = [...(current.imagesJson ?? [])];
      next.splice(index, 1);
      const oldPrimary = current.primaryImageIndex ?? 0;
      const nextPrimary = next.length === 0 ? 0 : index < oldPrimary ? oldPrimary - 1 : Math.min(oldPrimary, next.length - 1);
      return { ...current, imagesJson: next, primaryImageIndex: nextPrimary };
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requiredText(form.name) || !requiredText(form.shortDescription) || !requiredText(form.region) || !form.categoryId || form.price <= 0) { toast.error(labels.required); return; }
    if (images.length > MAX_IMAGES) { toast.error(`حداکثر ${MAX_IMAGES} تصویر مجاز است.`); return; }
    setBusy(true);
    try {
      const endpoint = isEdit ? `/api/admin/products/${form.id}` : '/api/admin/products';
      const common = { name: form.name.trim(), shortDescription: form.shortDescription.trim(), description: form.description.trim(), price: form.price, inStock: form.inStock, badge: form.badge.trim() || null, region: form.region.trim(), imagesJson: images, primaryImageIndex: primaryIndex };
      const payload = isEdit ? common : { slug: form.slug.trim(), ...common, currency: form.currency, categoryId: form.categoryId };
      const response = await fetch(endpoint, { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? labels.error);
      toast.success(labels.success); router.push(`/${locale}/admin/products`); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : labels.error); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Package className="h-5 w-5" /></div><div><h1 className="font-display text-2xl font-black text-foreground">{isEdit ? labels.editTitle : labels.createTitle}</h1><p className="mt-1 text-xs text-muted-foreground">اطلاعات محصول، قیمت، دسته‌بندی، تصاویر و وضعیت موجودی را در یک فرم استاندارد مدیریت کنید.</p></div></div><Button type="button" variant="outline" onClick={() => router.push(`/${locale}/admin/products`)}><ArrowRight className="h-4 w-4 rtl:rotate-180" />{labels.back}</Button></header>

      <form onSubmit={submit} className="space-y-5">
        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Card className="p-5"><SectionTitle icon={<Tag className="h-4 w-4" />} title="اطلاعات اصلی محصول" description="نام، شناسه و توضیحات قابل نمایش به مشتری" /><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label={labels.name} value={form.name} onChange={(value) => update('name', value)} required /><Field label={labels.slug} value={form.slug} onChange={(value) => update('slug', value)} required disabled={isEdit} /><div className="md:col-span-2"><Field label={labels.shortDescription} value={form.shortDescription} onChange={(value) => update('shortDescription', value)} required /></div><div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold">{labels.description}</label><textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={8} className="w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></div></div></Card>

          <div className="space-y-5"><Card className="p-5"><SectionTitle icon={<Tag className="h-4 w-4" />} title="فروش و دسته‌بندی" description="قیمت‌گذاری و قرارگیری محصول" /><div className="mt-5 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label={labels.price} value={String(form.price || '')} onChange={(value) => update('price', Number(value) || 0)} type="number" min="0" step="0.01" required /><SelectField label={labels.currency} value={form.currency} onChange={(value) => update('currency', value)} disabled={isEdit} options={[['AFN','افغانی (AFN)'],['USD','دلار (USD)'],['EUR','یورو (EUR)']]} /></div><SelectField label={labels.category} value={form.categoryId} onChange={(value) => update('categoryId', value)} disabled={isEdit} options={categories.map((category) => [category.id, category.name])} /><div className="grid gap-4 sm:grid-cols-2"><Field label={labels.region} value={form.region} onChange={(value) => update('region', value)} required /><Field label={labels.badge} value={form.badge} onChange={(value) => update('badge', value)} /></div></div></Card><Card className="p-5"><SectionTitle icon={<Truck className="h-4 w-4" />} title="وضعیت موجودی" description="کنترل سریع وضعیت فروش محصول" /><label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-muted/20 px-4 py-4"><span><span className="block text-sm font-bold">{labels.inStock}</span><span className="mt-1 block text-xs text-muted-foreground">{form.inStock ? 'محصول برای خرید در دسترس است.' : 'محصول فعلاً برای خرید غیرفعال است.'}</span></span><input type="checkbox" checked={form.inStock} onChange={(event) => update('inStock', event.target.checked)} className="h-5 w-5 rounded" /></label></Card></div>
        </section>

        <Card className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-primary" /><h2 className="text-sm font-black">گالری تصاویر محصول</h2></div><p className="mt-1 text-xs text-muted-foreground">تا {MAX_IMAGES} تصویر آپلود کنید؛ تصویر اول یا تصویر انتخاب‌شده به‌عنوان تصویر اصلی محصول استفاده می‌شود.</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted"><Upload className="h-4 w-4" />{uploading ? 'در حال آپلود…' : 'افزودن تصاویر'}<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploading || images.length >= MAX_IMAGES} onChange={(e) => { void uploadImages(e.target.files); e.currentTarget.value = ''; }} /></label></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{images.map((url, index) => <div key={`${url}-${index}`} className={`relative overflow-hidden rounded-2xl border ${index === primaryIndex ? 'border-primary ring-2 ring-primary/15' : 'border-border'}`}><img src={url} alt={`تصویر محصول ${index + 1}`} className="aspect-square w-full object-cover" /><div className="absolute inset-x-2 bottom-2 flex gap-2"><button type="button" onClick={() => update('primaryImageIndex', index)} className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-black backdrop-blur ${index === primaryIndex ? 'bg-primary text-primary-foreground' : 'bg-black/60 text-white'}`}>{index === primaryIndex ? 'تصویر اصلی' : 'انتخاب اصلی'}</button><button type="button" onClick={() => removeImage(index)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur" aria-label="حذف تصویر"><X className="h-4 w-4" /></button></div></div>)}{images.length === 0 ? <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">هنوز تصویری اضافه نشده است. برای شروع، «افزودن تصاویر» را بزنید.</div> : null}</div></Card>

        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /><div><p className="text-sm font-bold">آماده ثبت محصول</p><p className="mt-1 text-xs text-muted-foreground">قبل از ذخیره، اطلاعات، تصاویر و وضعیت فروش محصول را بررسی کنید.</p></div></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => router.push(`/${locale}/admin/products`)} disabled={busy}>{labels.cancel}</Button><Button type="submit" disabled={busy || uploading}>{busy ? labels.save : isEdit ? labels.save : labels.create}</Button></div></Card>
      </form>
    </div>
  );
}

function SectionTitle({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) { return <div className="flex items-start gap-3"><div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div><div><h2 className="text-sm font-black">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{description}</p></div></div>; }
function Field({ label, value, onChange, type = 'text', min, step, required = false, disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; step?: string; required?: boolean; disabled?: boolean }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-foreground">{label}</span><input type={type} min={min} step={step} required={required} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60" /></label>; }
function SelectField({ label, value, onChange, options, disabled = false }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; disabled?: boolean }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-foreground">{label}</span><select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>; }
