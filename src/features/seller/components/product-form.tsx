'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ProductImagesEditor } from './product-images-editor';
import { X, Plus, Package, Tag, ImagePlus } from 'lucide-react';
import { normalizePersianDigits } from '@/features/products/product-contract';

interface CategoryOption { id: string; key: string; name: string }
interface Attribute { key: string; value: string }
export interface ProductFormInitial {
  id?: string; slug?: string; name?: string; shortDescription?: string; description?: string | null;
  price?: number; compareAtPrice?: number | null; categoryId?: string; inStock?: boolean; isActive?: boolean;
  stockQuantity?: number; images?: string[]; primaryImageIndex?: number; whatsappNumber?: string | null;
  isTraditional?: boolean; weightKg?: number | null; dimensionsJson?: string | null; tagsJson?: string | null; attributesJson?: string | null;
}
interface ProductFormProps { mode: 'create' | 'edit'; categories: CategoryOption[]; initial?: ProductFormInitial; backHref: string }

const inputCls = 'h-11 w-full rounded-2xl border border-input bg-background px-3.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15';
function numberValue(value: string) { const n = Number(normalizePersianDigits(value).replace(/[٬,\s]/g, '').replace(/٫/g, '.')); return Number.isFinite(n) ? n : 0; }
function slugify(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80); }
function parseJson<T>(value: string | null | undefined, fallback: T): T { if (!value) return fallback; try { return JSON.parse(value) as T; } catch { return fallback; } }
function cleanWhatsapp(value: string) { return value.replace(/[^0-9+]/g, '').slice(0, 20); }

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</span><h2 className="text-base font-black">{title}</h2></div>{children}</section>;
}

export function ProductForm({ mode, categories, initial, backHref }: ProductFormProps) {
  const router = useRouter(); const isEdit = mode === 'edit';
  const [name, setName] = React.useState(initial?.name ?? ''); const [slug, setSlug] = React.useState(initial?.slug ?? '');
  const [shortDescription, setShortDescription] = React.useState(initial?.shortDescription ?? ''); const [description, setDescription] = React.useState(initial?.description ?? '');
  const [price, setPrice] = React.useState(initial?.price != null ? String(initial.price) : ''); const [compareAt, setCompareAt] = React.useState(initial?.compareAtPrice != null ? String(initial.compareAtPrice) : '');
  const [categoryId, setCategoryId] = React.useState(initial?.categoryId ?? categories[0]?.id ?? ''); const [stockQuantity, setStockQuantity] = React.useState(initial?.stockQuantity != null ? String(initial.stockQuantity) : '0');
  const [isActive, setIsActive] = React.useState(initial?.isActive !== false); const [isTraditional, setIsTraditional] = React.useState(initial?.isTraditional === true);
  const [weightKg, setWeightKg] = React.useState(initial?.weightKg != null ? String(initial.weightKg) : ''); const dimensions = parseJson<{length?:number;width?:number;height?:number}>(initial?.dimensionsJson, {});
  const [dimLength, setDimLength] = React.useState(dimensions.length != null ? String(dimensions.length) : ''); const [dimWidth, setDimWidth] = React.useState(dimensions.width != null ? String(dimensions.width) : ''); const [dimHeight, setDimHeight] = React.useState(dimensions.height != null ? String(dimensions.height) : '');
  const [tags, setTags] = React.useState<string>(() => { const v = parseJson<string[]>(initial?.tagsJson, []); return Array.isArray(v) ? v.join('، ') : ''; });
  const [attributes, setAttributes] = React.useState<Attribute[]>(() => parseJson<Attribute[]>(initial?.attributesJson, [])); const [whatsappNumber, setWhatsappNumber] = React.useState(initial?.whatsappNumber ?? '');
  const [busy, setBusy] = React.useState(false); const [slugTouched, setSlugTouched] = React.useState(Boolean(initial?.slug));
  React.useEffect(() => { if (!slugTouched && name) setSlug(slugify(name)); }, [name, slugTouched]);

  function addAttribute() { setAttributes((items) => [...items, { key: '', value: '' }]); }
  function updateAttribute(index: number, key: 'key' | 'value', value: string) { setAttributes((items) => items.map((item, i) => i === index ? { ...item, [key]: value } : item)); }
  function removeAttribute(index: number) { setAttributes((items) => items.filter((_, i) => i !== index)); }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return toast.error('نام محصول الزامی است.');
    if (!shortDescription.trim()) return toast.error('توضیح کوتاه محصول الزامی است.');
    const numericPrice = numberValue(price); if (numericPrice <= 0) return toast.error('قیمت باید بیشتر از صفر باشد.');
    if (!categoryId) return toast.error('دسته‌بندی محصول را انتخاب کنید.');
    const quantity = Math.max(0, Math.floor(numberValue(stockQuantity)));
    const oldPrice = compareAt.trim() ? numberValue(compareAt) : null;
    if (oldPrice !== null && oldPrice <= numericPrice) return toast.error('قیمت قبلی باید از قیمت فعلی بیشتر باشد.');
    setBusy(true);
    try {
      const payload = {
        slug: slug.trim() || null, name: name.trim(), shortDescription: shortDescription.trim(), description: description.trim() || null,
        price: numericPrice, compareAtPrice: oldPrice, categoryId, inStock: quantity > 0, isActive, stockQuantity: quantity,
        whatsappNumber: whatsappNumber ? cleanWhatsapp(whatsappNumber) : null, isTraditional,
        weightKg: weightKg.trim() ? numberValue(weightKg) : null,
        dimensionsJson: dimLength || dimWidth || dimHeight ? JSON.stringify({ length: numberValue(dimLength), width: numberValue(dimWidth), height: numberValue(dimHeight) }) : null,
        tagsJson: JSON.stringify(tags.split(/[،,]+/).map((item) => item.trim()).filter(Boolean)),
        attributesJson: JSON.stringify(attributes.filter((item) => item.key.trim() && item.value.trim())),
        ...(isEdit ? {} : { currency: 'AFN' }),
      };
      const endpoint = isEdit && initial?.id ? `/api/seller/products/${initial.id}` : '/api/seller/products';
      const response = await fetch(endpoint, { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? 'ثبت محصول ناموفق بود.');
      toast.success(isEdit ? 'محصول با موفقیت به‌روزرسانی شد.' : 'محصول با موفقیت ثبت شد.'); router.push(backHref); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'ثبت محصول ناموفق بود.'); } finally { setBusy(false); }
  }

  return <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-5" dir="rtl">
    <header className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Package className="h-6 w-6" /></span><div><h1 className="text-2xl font-black">{isEdit ? 'ویرایش محصول' : 'ثبت محصول جدید'}</h1><p className="mt-1 text-xs leading-6 text-muted-foreground">همه اطلاعات را به فارسی وارد کنید؛ تصاویر به‌صورت جداگانه و امن مدیریت می‌شوند.</p></div></div></header>
    <Section title="اطلاعات اصلی" icon={<Tag className="h-5 w-5" />}><div className="grid gap-4 sm:grid-cols-2"><Field label="نام محصول" required value={name} onChange={setName} placeholder="مثلاً قالی دست‌باف هراتی" /><Field label="شناسه صفحه" value={slug} onChange={(value) => { setSlugTouched(true); setSlug(value); }} placeholder="خودکار ساخته می‌شود" dir="ltr" /><div className="sm:col-span-2"><Field label="توضیح کوتاه" required value={shortDescription} onChange={setShortDescription} /><label className="mt-4 block"><span className="mb-2 block text-xs font-bold">توضیحات کامل</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="w-full rounded-2xl border border-input bg-background p-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label></div></div></Section>
    <Section title="قیمت و دسته‌بندی" icon={<Tag className="h-5 w-5" />}><div className="grid gap-4 sm:grid-cols-2"><Field label="قیمت فعلی" required value={price} onChange={setPrice} inputMode="decimal" /><Field label="قیمت قبلی (اختیاری)" value={compareAt} onChange={setCompareAt} inputMode="decimal" /><label className="space-y-2"><span className="text-xs font-bold">دسته‌بندی</span><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><Field label="موجودی" value={stockQuantity} onChange={setStockQuantity} inputMode="numeric" /></div><label className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-4 text-sm font-bold"><input type="checkbox" checked={isTraditional} onChange={(e) => setIsTraditional(e.target.checked)} className="h-5 w-5" />این محصول در بخش محصولات وطنی نمایش داده شود.</label><label className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-4 text-sm font-bold"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5" />محصول فعال و قابل نمایش باشد.</label></Section>
    <Section title="تصاویر محصول" icon={<ImagePlus className="h-5 w-5" />}><p className="mb-4 text-xs leading-6 text-muted-foreground">فقط تصویر مجاز است؛ فرمت‌های تصویری پشتیبانی‌شده را می‌توانید مستقیماً انتخاب کنید. ویدیو در این مسیر وجود ندارد.</p>{isEdit && initial?.id ? <ProductImagesEditor productId={initial.id} initial={initial.images ?? []} initialPrimaryIndex={initial.primaryImageIndex ?? 0} /> : <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">ابتدا محصول را ثبت کنید؛ سپس گالری تصاویر را اضافه و تصویر اصلی را انتخاب کنید.</div>}</Section>
    <Section title="مشخصات تکمیلی" icon={<Plus className="h-5 w-5" />}><div className="grid gap-4 sm:grid-cols-2"><Field label="وزن (کیلوگرم)" value={weightKg} onChange={setWeightKg} inputMode="decimal" /><Field label="شماره واتساپ فروشنده" value={whatsappNumber} onChange={(value) => setWhatsappNumber(cleanWhatsapp(value))} dir="ltr" /></div><div className="mt-4 grid grid-cols-3 gap-3"><Field label="طول" value={dimLength} onChange={setDimLength} inputMode="decimal" /><Field label="عرض" value={dimWidth} onChange={setDimWidth} inputMode="decimal" /><Field label="ارتفاع" value={dimHeight} onChange={setDimHeight} inputMode="decimal" /></div><label className="mt-4 block"><span className="mb-2 block text-xs font-bold">برچسب‌ها</span><input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="مثلاً دست‌ساز، هراتی، باکیفیت" /></label><div className="mt-5 space-y-2">{attributes.map((item, index) => <div key={index} className="flex gap-2"><input value={item.key} onChange={(e) => updateAttribute(index, 'key', e.target.value)} className={inputCls} placeholder="ویژگی" /><input value={item.value} onChange={(e) => updateAttribute(index, 'value', e.target.value)} className={inputCls} placeholder="مقدار" /><button type="button" onClick={() => removeAttribute(index)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border text-destructive" aria-label="حذف ویژگی"><X className="h-4 w-4" /></button></div>)}<Button type="button" variant="outline" size="sm" onClick={addAttribute}><Plus className="h-4 w-4" />افزودن ویژگی</Button></div></Section>
    <div className="sticky bottom-3 z-10 flex justify-end gap-2 rounded-3xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur"><Button type="button" variant="outline" onClick={() => router.push(backHref)} disabled={busy}>انصراف</Button><Button type="submit" disabled={busy}>{busy ? 'در حال ثبت…' : isEdit ? 'ذخیره تغییرات' : 'ثبت محصول'}</Button></div>
  </form>;
}

function Field({ label, value, onChange, required = false, placeholder, inputMode, dir }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; dir?: 'ltr' | 'rtl' }) {
  return <label className="block space-y-2"><span className="text-xs font-bold">{label}{required ? ' *' : ''}</span><input dir={dir} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} className={inputCls} required={required} /></label>;
}
