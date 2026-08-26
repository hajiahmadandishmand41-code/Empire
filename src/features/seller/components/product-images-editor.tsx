'use client';

/**
 * ProductImagesEditor — Phase 13.
 *
 * Enhanced image editor with:
 * - Minimum 3 image slots shown
 * - Primary image selection (star icon)
 * - Native drag-and-drop reordering with persistence
 * - Each image: preview, remove, set-as-primary
 */
import * as React from 'react';
import { toast } from 'sonner';
import { X, Upload, Star, ImagePlus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  productId: string;
  initial: string[];
  initialPrimaryIndex?: number;
}

const MAX_BYTES = 3 * 1024 * 1024;
const MIN_IMAGES = 3;
const MAX_IMAGES = 10;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ProductImagesEditor({ productId, initial, initialPrimaryIndex = 0 }: Props) {
  const [images, setImages] = React.useState<string[]>(initial);
  const [primaryIndex, setPrimaryIndex] = React.useState<number>(initialPrimaryIndex);
  const [busy, setBusy] = React.useState(false);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function savePrimaryIndex(idx: number) {
    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ primaryImageIndex: idx }),
      });
      if (!res.ok) throw new Error('primary_update_failed');
    } catch {
      toast.error('ذخیره تصویر اصلی ناموفق بود');
    }
  }

  async function saveOrder(nextImages: string[], nextPrimaryIndex: number) {
    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imagesJson: JSON.stringify(nextImages), primaryImageIndex: nextPrimaryIndex }),
      });
      if (!res.ok) throw new Error('order_update_failed');
      return true;
    } catch {
      return false;
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`حداکثر ${MAX_IMAGES} تصویر مجاز است`);
      return;
    }
    const list = Array.from(files).slice(0, remaining);
    setBusy(true);
    try {
      const results = await Promise.all(
        list.map(async (file) => {
          if (!file.type.startsWith('image/')) {
            toast.error(`${file.name}: فرمت پشتیبانی نمی‌شود`);
            return null;
          }
          if (file.size > MAX_BYTES) {
            toast.error(`${file.name}: حجم بیش از ۳ مگابایت`);
            return null;
          }
          const dataUrl = await fileToDataUrl(file);
          const res = await fetch(`/api/seller/products/${productId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ dataUrl, alt: file.name }),
          });
          const body = await res.json().catch(() => null);
          if (!res.ok || !body?.ok) {
            toast.error(body?.error?.message ?? `${file.name}: آپلود ناموفق`);
            return null;
          }
          toast.success(`${file.name} افزوده شد`);
          return body.data.url as string;
        }),
      );
      setImages((prev) => [...prev, ...results.filter((u): u is string => Boolean(u))]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onRemove(url: string, idx: number) {
    setBusy(true);
    try {
      const res = await fetch(`/api/seller/products/${productId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        toast.error(body?.error?.message ?? 'حذف ناموفق');
        return;
      }
      const next = images.filter((u) => u !== url);
      const nextPrimary = next.length === 0 ? 0 : idx === primaryIndex ? 0 : idx < primaryIndex ? primaryIndex - 1 : Math.min(primaryIndex, next.length - 1);
      setImages(next);
      setPrimaryIndex(nextPrimary);
      toast.success('تصویر حذف شد');
    } finally {
      setBusy(false);
    }
  }

  async function onDrop(targetIndex: number) {
    if (dragIndex == null || dragIndex === targetIndex || busy) return;
    setBusy(true);
    const from = dragIndex;
    const primaryUrl = images[primaryIndex];
    const insertionIndex = from < targetIndex ? targetIndex - 1 : targetIndex;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    if (!moved) {
      setBusy(false);
      setDragIndex(null);
      return;
    }
    next.splice(insertionIndex, 0, moved);
    const nextPrimary = primaryUrl ? Math.max(0, next.indexOf(primaryUrl)) : 0;

    const previousImages = images;
    const previousPrimary = primaryIndex;
    setImages(next);
    setPrimaryIndex(nextPrimary);
    setDragIndex(null);

    const saved = await saveOrder(next, nextPrimary);
    if (!saved) {
      setImages(previousImages);
      setPrimaryIndex(previousPrimary);
      toast.error('ترتیب تصاویر ذخیره نشد؛ تغییرات برگردانده شد');
    } else {
      toast.success('ترتیب تصاویر ذخیره شد');
    }
    setBusy(false);
  }

  async function onSetPrimary(idx: number) {
    setPrimaryIndex(idx);
    await savePrimaryIndex(idx);
    toast.success('تصویر اصلی تنظیم شد');
  }

  const emptySlots = Math.max(0, MIN_IMAGES - images.length);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy || images.length >= MAX_IMAGES}>
          <Upload className="h-4 w-4" />
          {busy ? 'در حال پردازش…' : 'افزودن تصویر'}
        </Button>
        <span className="text-xs text-muted-foreground">حداکثر ۳ مگابایت — JPEG/PNG/WebP/GIF — {images.length}/{MAX_IMAGES} تصویر</span>
      </div>

      {images.length < MIN_IMAGES && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
          <span className="shrink-0 text-amber-500">⚠</span>
          برای حرفه‌ای‌تر نمایش داده شدن محصول، حداقل ۳ تصویر آپلود کنید. ({MIN_IMAGES - images.length} تصویر دیگر لازم است)
        </div>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {images.map((src, idx) => (
          <li
            key={src}
            draggable={!busy}
            onDragStart={() => setDragIndex(idx)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onDrop(idx)}
            onDragEnd={() => setDragIndex(null)}
            className={`group relative overflow-hidden rounded-xl border-2 transition-all ${idx === primaryIndex ? 'border-rose-500 shadow-md shadow-rose-200 dark:shadow-rose-900' : 'border-border hover:border-rose-300'} ${dragIndex === idx ? 'opacity-60' : ''}`}
          >
            <img src={src} alt={`تصویر ${idx + 1}`} className="aspect-square w-full object-cover" loading="lazy" />
            <div className="absolute start-1 bottom-1 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white" title="برای تغییر ترتیب بکشید"><GripVertical className="h-3 w-3" aria-hidden="true" />{idx + 1}</div>
            {idx === primaryIndex && <div className="absolute start-1 top-1 flex items-center gap-0.5 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow"><Star className="h-2.5 w-2.5 fill-white" /> اصلی</div>}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              {idx !== primaryIndex && <button type="button" onClick={() => onSetPrimary(idx)} disabled={busy} title="تنظیم به عنوان تصویر اصلی" className="flex items-center gap-1 rounded-full bg-rose-600/90 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-rose-700"><Star className="h-3 w-3" /> تصویر اصلی</button>}
              <button type="button" onClick={() => onRemove(src, idx)} disabled={busy} aria-label="حذف تصویر" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-red-600"><X className="h-3.5 w-3.5" /></button>
            </div>
          </li>
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <li key={`empty-${i}`} onClick={() => inputRef.current?.click()} className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 text-muted-foreground transition-colors hover:border-rose-300 hover:bg-rose-50/30 dark:hover:bg-rose-950/20"><ImagePlus className="h-6 w-6" /><span className="text-xs font-medium">تصویر {images.length + i + 1}</span></li>
        ))}
      </ul>

      {images.length > 0 && <p className="text-xs text-muted-foreground">برای تغییر ترتیب، تصویر را بکشید و روی جایگاه جدید رها کنید. تصویر ستاره‌دار تصویر اصلی است.</p>}
    </div>
  );
}
