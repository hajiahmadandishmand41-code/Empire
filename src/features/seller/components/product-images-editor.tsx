'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { X, Upload, Star, ImagePlus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRODUCT_IMAGE_MIME_TYPES, PRODUCT_MAX_IMAGE_BYTES, PRODUCT_MAX_IMAGES } from '@/features/products/product-contract';

interface Props { productId: string; initial: string[]; initialPrimaryIndex?: number }
const MIN_IMAGES = 3;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result ?? '')); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
}

export function ProductImagesEditor({ productId, initial, initialPrimaryIndex = 0 }: Props) {
  const [images, setImages] = React.useState<string[]>(initial);
  const [primaryIndex, setPrimaryIndex] = React.useState<number>(Math.max(0, Math.min(initialPrimaryIndex, Math.max(initial.length - 1, 0))));
  const [busy, setBusy] = React.useState(false);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function savePatch(payload: { images?: string[]; primaryImageIndex?: number }) {
    const res = await fetch(`/api/seller/products/${productId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok) throw new Error(body?.error?.message ?? 'خطا در ذخیره محصول');
    return body;
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length || busy) return;
    const remaining = PRODUCT_MAX_IMAGES - images.length;
    if (remaining <= 0) { toast.error(`حداکثر ${PRODUCT_MAX_IMAGES} تصویر مجاز است.`); return; }
    const list = Array.from(files).slice(0, remaining);
    setBusy(true);
    try {
      const results = await Promise.all(list.map(async (file) => {
        if (!(PRODUCT_IMAGE_MIME_TYPES as readonly string[]).includes(file.type) || file.size <= 0 || file.size > PRODUCT_MAX_IMAGE_BYTES) { toast.error(`${file.name}: فرمت یا حجم تصویر نامعتبر است.`); return null; }
        const dataUrl = await fileToDataUrl(file);
        const res = await fetch(`/api/seller/products/${productId}/images`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ dataUrl, alt: file.name }) });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.ok || typeof body?.data?.url !== 'string') { toast.error(body?.error?.message ?? `${file.name}: آپلود ناموفق.`); return null; }
        return body.data.url as string;
      }));
      const added = results.filter((url): url is string => Boolean(url));
      if (added.length) { setImages((prev) => [...prev, ...added]); toast.success(`${added.length} تصویر افزوده شد.`); }
    } finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  }

  async function onRemove(url: string, idx: number) {
    setBusy(true);
    try {
      const res = await fetch(`/api/seller/products/${productId}/images`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ url }) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) throw new Error(body?.error?.message ?? 'حذف تصویر ناموفق بود.');
      const next = images.filter((item) => item !== url);
      const nextPrimary = next.length === 0 ? 0 : idx === primaryIndex ? 0 : idx < primaryIndex ? primaryIndex - 1 : Math.min(primaryIndex, next.length - 1);
      setImages(next); setPrimaryIndex(nextPrimary); toast.success('تصویر حذف شد.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'حذف ناموفق بود.'); }
    finally { setBusy(false); }
  }

  async function onSetPrimary(idx: number) {
    const previous = primaryIndex;
    setPrimaryIndex(idx); setBusy(true);
    try { await savePatch({ primaryImageIndex: idx }); toast.success('تصویر اصلی تنظیم شد.'); }
    catch (error) { setPrimaryIndex(previous); toast.error(error instanceof Error ? error.message : 'ذخیره تصویر اصلی ناموفق بود.'); }
    finally { setBusy(false); }
  }

  async function onDrop(targetIndex: number) {
    if (dragIndex == null || dragIndex === targetIndex || busy) return;
    const from = dragIndex; const beforeImages = images; const beforePrimary = primaryIndex; const primaryUrl = images[primaryIndex];
    const next = [...images]; const [moved] = next.splice(from, 1); if (!moved) return;
    const insertionIndex = from < targetIndex ? targetIndex - 1 : targetIndex; next.splice(insertionIndex, 0, moved);
    const nextPrimary = primaryUrl ? Math.max(0, next.indexOf(primaryUrl)) : 0;
    setImages(next); setPrimaryIndex(nextPrimary); setDragIndex(null); setBusy(true);
    try { await savePatch({ images: next, primaryImageIndex: nextPrimary }); toast.success('ترتیب تصاویر ذخیره شد.'); }
    catch (error) { setImages(beforeImages); setPrimaryIndex(beforePrimary); toast.error(error instanceof Error ? error.message : 'ترتیب تصاویر ذخیره نشد؛ تغییرات برگردانده شد.'); }
    finally { setBusy(false); }
  }

  const emptySlots = Math.max(0, MIN_IMAGES - images.length);
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3"><input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void onFiles(e.target.files); }} /><Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy || images.length >= PRODUCT_MAX_IMAGES}><Upload className="h-4 w-4" />{busy ? 'در حال پردازش…' : 'افزودن تصویر'}</Button><span className="text-xs text-muted-foreground">فرمت‌های متداول تصویر، حداکثر ۱۰ مگابایت — {images.length}/{PRODUCT_MAX_IMAGES} تصویر</span></div>
    {images.length < MIN_IMAGES && <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"><span className="shrink-0 text-amber-500">⚠</span>برای نمایش حرفه‌ای محصول، حداقل ۳ تصویر پیشنهاد می‌شود. ({MIN_IMAGES - images.length} تصویر دیگر)</div>}
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{images.map((src, idx) => <li key={src} draggable={!busy} onDragStart={() => setDragIndex(idx)} onDragOver={(event) => event.preventDefault()} onDrop={() => void onDrop(idx)} onDragEnd={() => setDragIndex(null)} className={`group relative overflow-hidden rounded-xl border-2 transition-all ${idx === primaryIndex ? 'border-rose-500 shadow-md shadow-rose-200 dark:shadow-rose-900' : 'border-border hover:border-rose-300'} ${dragIndex === idx ? 'opacity-60' : ''}`}><img src={src} alt={`تصویر ${idx + 1}`} className="aspect-square w-full object-cover" loading="lazy" /><div className="absolute start-1 bottom-1 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white" title="برای تغییر ترتیب بکشید"><GripVertical className="h-3 w-3" aria-hidden="true" />{idx + 1}</div>{idx === primaryIndex && <div className="absolute start-1 top-1 flex items-center gap-0.5 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow"><Star className="h-2.5 w-2.5 fill-white" /> اصلی</div>}<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">{idx !== primaryIndex && <button type="button" onClick={() => void onSetPrimary(idx)} disabled={busy} className="flex items-center gap-1 rounded-full bg-rose-600/90 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700"><Star className="h-3 w-3" /> تصویر اصلی</button>}<button type="button" onClick={() => void onRemove(src, idx)} disabled={busy} aria-label="حذف تصویر" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600"><X className="h-3.5 w-3.5" /></button></div></li>)}{Array.from({ length: emptySlots }).map((_, i) => <li key={`empty-${i}`} onClick={() => inputRef.current?.click()} className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 text-muted-foreground"><ImagePlus className="h-6 w-6" /><span className="text-xs font-medium">تصویر {images.length + i + 1}</span></li>)}</ul>
  </div>;
}
