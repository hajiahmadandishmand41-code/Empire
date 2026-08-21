'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, ImagePlus, Package, Tag, Trash2, Truck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CategoryOption { id: string; name: string }
interface ProductImage { src: string; alt?: string }
export interface AdminProductFormValue {
  id?: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  region: string;
  badge: string;
  inStock: boolean;
  images?: ProductImage[];
}

interface ProductFormProps {
  locale: string;
  categories: CategoryOption[];
  initial?: AdminProductFormValue;
  labels: {
    createTitle: string; editTitle: string; name: string; slug: string; shortDescription: string; description: string;
    price: string; currency: string; category: string; region: string; badge: string; inStock: string; save: string;
    create: string; back: string; required: string; success: string; error: string; cancel: string;
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('image_read_failed'));
    reader.readAsDataURL(file);
  });
}

export function ProductForm({ locale, categories, initial, labels }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState<AdminProductFormValue>(initial ?? {
    slug: '', name: '', shortDescription: '', description: '', price: 0,
    currency: 'AFN', categoryId: categories[0]?.id ?? '', region: '', badge: '', inStock: true, images: [],
  });
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [images, setImages] = React.useState<ProductImage[]>(initial?.images ?? []);

  function update<K extends keyof AdminProductFormValue>(key: K, value: AdminProductFormValue[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function requiredText(value: string) { return value.trim().length >= 1; }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (incoming.some((file) => file.size > 3 * 1024 * 1024)) {
      toast.error('هر تصویر باید حداکثر ۳ مگابایت باشد.');
    }
    const accepted = incoming.filter((file) => file.size <= 3 * 1024 * 1024);
    setPendingFiles((current) => [...current, ...accepted].slice(0, Math.max(0, 10 - images.length)));
  }

  async function uploadPending(productId: string) {
    if (!pendingFiles.length) return;
    for (const file of pendingFiles) {
      const dataUrl = await fileToDataUrl(file);
      const response = await fetch(`/api/seller/products/${encodeURIComponent(productId)}/images`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ dataUrl, alt: form.name.trim() }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? 'آپلود تصویر ناموفق بود.');
    }
  }

  async function removeImage(image: ProductImage) {
    if (!form.id) return;
    const response = await fetch(`/api/seller/products/${encodeURIComponent(form.id)}/images`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ url: image.src }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.ok) { toast.error(body?.error?.message ?? 'حذف تصویر ناموفق بود.'); return; }
    setImages((current) => current.filter((item) => item.src !== image.src));
    toast.success('تصویر حذف شد.');
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requiredText(form.name) || !requiredText(form.shortDescription) || !requiredText(form.region) || !form.categoryId || form.price <= 0) {
      toast.error(labels.required); return;
    }
    if (images.length + pendingFiles.length === 0) {
      toast.error('حداقل یک تصویر برای محصول اضافه کنید.'); return;
    }
    setBusy(true);
    try {
      const endpoint = isEdit ? `/api/admin/products/${form.id}` : '/api/admin/products';
      const payload = isEdit
        ? { name: form.name.trim(), shortDescription: form.shortDescription.trim(), description: form.description.trim(), price: form.price, inStock: form.inStock, badge: form.badge.trim() || null, region: form.region.trim() }
        : { slug: form.slug.trim(), name: form.name.trim(), shortDescription: form.shortDescription.trim(), description: form.description.trim(), price: form.price, currency: form.currency, categoryId: form.categoryId, region: form.region.trim(), badge: form.badge.trim() || undefined, inStock: form.inStock };
      const response = await fetch(endpoint, { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? labels.error);
      const productId = String(body.data?.id ?? form.id ?? '');
      if (!productId) throw new Error(labels.error);
      await uploadPending(productId);
      toast.success(labels.success); router.push(`/${locale}/admin/products`); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : labels.error); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Package className="h-5 w-5" /></div><div><h1 className="font-display text-2xl font-black text-foreground">{isEdit ? labels.editTitle : labels.createTitle}</h1><p className="mt-1 text-xs text-muted-foreground">اطلاعات محصول، تصاویر، قیمت، دسته‌بندی و وضعیت موجودی را در یک فرم استاندارد مدیریت کنید.</p></div></div>
        <Button type="button" variant="outline" onClick={() => router.push(`/${locale}/admin/products`)}><ArrowRight className="h-4 w-4 rtl:rotate-180" />{labels.back}</Button>
      </header>

      <form onSubmit={submit} className="space-y-5">
        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Card className="p-5">
            <SectionTitle icon={<Tag className="h-4 w-4" />} title="اطلاعات اصلی محصول" description="نام، شناسه و توضیحات قابل نمایش به مشتری" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label={labels.name} value={form.name} onChange={(value) => update('name', value)} required />
              <Field label={labels.slug} value={form.slug} onChange={(value) => update('slug', value)} required disabled={isEdit} />
              <div className="md:col-span-2"><Field label={labels.shortDescription} value={form.shortDescription} onChange={(value) => update('shortDescription', value)} required /></div>
              <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold">{labels.description}</label><textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={8} className="w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></div>
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="p-5">
              <SectionTitle icon={<Tag className="h-4 w-4" />} title="فروش و دسته‌بندی" description="قیمت‌گذاری و قرارگیری محصول" />
              <div className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2"><Field label={labels.price} value={String(form.price || '')} onChange={(value) => update('price', Number(value) || 0)} type="number" min="0" step="0.01" required /><SelectField label={labels.currency} value={form.currency} onChange={(value) => update('currency', value)} disabled={isEdit} options={[['AFN','افغانی (AFN)'],['USD','دلار (USD)'],['EUR','یورو (EUR)']]} /></div>
                <SelectField label={labels.category} value={form.categoryId} onChange={(value) => update('categoryId', value)} disabled={isEdit} options={categories.map((category) => [category.id, category.name])} />
                <div className="grid gap-4 sm:grid-cols-2"><Field label={labels.region} value={form.region} onChange={(value) => update('region', value)} required /><Field label={labels.badge} value={form.badge} onChange={(value) => update('badge', value)} /></div>
              </div>
            </Card>
            <Card className="p-5"><SectionTitle icon={<Truck className="h-4 w-4" />} title="وضعیت موجودی" description="کنترل سریع وضعیت فروش محصول" /><label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-muted/20 px-4 py-4"><span><span className="block text-sm font-bold">{labels.inStock}</span><span className="mt-1 block text-xs text-muted-foreground">{form.inStock ? 'محصول برای خرید در دسترس است.' : 'محصول فعلاً برای خرید غیرفعال است.'}</span></span><input type="checkbox" checked={form.inStock} onChange={(event) => update('inStock', event.target.checked)} className="h-5 w-5 rounded" /></label></Card>
          </div>
        </section>

        <Card className="p-5">
          <SectionTitle icon={<ImagePlus className="h-4 w-4" />} title="تصاویر محصول" description="حداقل یک تصویر، حداکثر ۱۰ تصویر؛ هر تصویر تا ۳ مگابایت." />
          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-6 py-8 text-center transition hover:bg-primary/10">
            <Upload className="h-7 w-7 text-primary" />
            <span className="mt-2 text-sm font-bold">افزودن تصاویر</span>
            <span className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP, GIF</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="sr-only" onChange={(event) => { addFiles(event.target.files); event.currentTarget.value = ''; }} />
          </label>
          {(images.length > 0 || pendingFiles.length > 0) && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((image, index) => <div key={image.src} className="overflow-hidden rounded-2xl border border-border bg-background"><div className="aspect-square bg-muted"><img src={image.src} alt={image.alt ?? form.name} className="h-full w-full object-cover" /></div><div className="flex items-center justify-between gap-2 p-2"><span className="truncate text-xs font-semibold">{index === 0 ? 'تصویر اصلی' : `تصویر ${index + 1}`}</span><button type="button" onClick={() => void removeImage(image)} disabled={busy || !form.id} className="rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:opacity-40" aria-label="حذف تصویر"><Trash2 className="h-4 w-4" /></button></div></div>)}
            {pendingFiles.map((file) => <div key={`${file.name}-${file.lastModified}`} className="overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-primary/5"><div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground">پیش‌نمایش پس از ثبت</div><div className="flex items-center justify-between gap-2 p-2"><span className="truncate text-xs font-semibold">{file.name}</span><button type="button" onClick={() => setPendingFiles((current) => current.filter((item) => item !== file))} className="rounded-lg p-2 text-destructive hover:bg-destructive/10" aria-label="حذف تصویر"><Trash2 className="h-4 w-4" /></button></div></div>)}
          </div>}
        </Card>

        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /><div><p className="text-sm font-bold">آماده ثبت محصول</p><p className="mt-1 text-xs text-muted-foreground">قبل از ذخیره، نام، تصویر، قیمت، دسته‌بندی و موجودی را بررسی کنید.</p></div></div>
          <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => router.push(`/${locale}/admin/products`)} disabled={busy}>{labels.cancel}</Button><Button type="submit" disabled={busy}>{busy ? labels.save : isEdit ? labels.save : labels.create}</Button></div>
        </Card>
      </form>
    </div>
  );
}

function SectionTitle({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) { return <div className="flex items-start gap-3"><div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div><div><h2 className="text-sm font-black">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{description}</p></div></div>; }
function Field({ label, value, onChange, type = 'text', min, step, required = false, disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; step?: string; required?: boolean; disabled?: boolean }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-foreground">{label}</span><input type={type} min={min} step={step} required={required} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60" /></label>; }
function SelectField({ label, value, onChange, options, disabled = false }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; disabled?: boolean }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-foreground">{label}</span><select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>; }
