'use client';

/**
 * ProductForm — Phase 13 (Complete Seller Panel)
 *
 * Handles both create and edit flows for the seller catalogue.
 * Fields: name, slug, price, compareAtPrice, stockQuantity, isActive,
 *         categoryId, shortDescription, description, weight, dimensions,
 *         tags, attributes/features, images (min 3, with primary), video upload,
 *         whatsappNumber, isTraditional.
 */
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ProductImagesEditor } from './product-images-editor';
import { X, Plus } from 'lucide-react';

/* ── Traditional Afghan subcategories ── */
const TRADITIONAL_CATEGORIES = [
  { key: 'carpet',        label: 'قالین',          emoji: '🎨' },
  { key: 'saffron',       label: 'زعفران',         emoji: '🌸' },
  { key: 'driedFruits',   label: 'میوه خشک',       emoji: '🍇' },
  { key: 'handicrafts',   label: 'صنایع دستی',     emoji: '🏺' },
  { key: 'localClothing', label: 'لباس محلی',      emoji: '👘' },
  { key: 'honey',         label: 'عسل',            emoji: '🍯' },
  { key: 'nuts',          label: 'خشکبار',         emoji: '🥜' },
  { key: 'gemstones',     label: 'سنگ قیمتی',      emoji: '💎' },
  { key: 'traditional',   label: 'سایر سنتی',      emoji: '✨' },
];

interface CategoryOption {
  id: string;
  key: string;
  name: string;
}

interface Attribute {
  key: string;
  value: string;
}

export interface ProductFormInitial {
  id?: string;
  slug?: string;
  name?: string;
  shortDescription?: string;
  description?: string | null;
  price?: number;
  compareAtPrice?: number | null;
  categoryId?: string;
  inStock?: boolean;
  isActive?: boolean;
  stockQuantity?: number;
  images?: string[];
  primaryImageIndex?: number;
  whatsappNumber?: string | null;
  videoUrl?: string | null;
  isTraditional?: boolean;
  weightKg?: number | null;
  dimensionsJson?: string | null;
  tagsJson?: string | null;
  attributesJson?: string | null;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  categories: CategoryOption[];
  initial?: ProductFormInitial;
  backHref: string;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function cleanWhatsapp(raw: string): string {
  return raw.replace(/[^0-9+]/g, '').slice(0, 20);
}

function parseDimensions(json: string | null | undefined) {
  if (!json) return { length: '', width: '', height: '' };
  try {
    const d = JSON.parse(json);
    return {
      length: String(d.length ?? ''),
      width: String(d.width ?? ''),
      height: String(d.height ?? ''),
    };
  } catch {
    return { length: '', width: '', height: '' };
  }
}

function parseTags(json: string | null | undefined): string {
  if (!json) return '';
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) return arr.join('، ');
  } catch {}
  return '';
}

function parseAttributes(json: string | null | undefined): Attribute[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) return arr;
  } catch {}
  return [];
}

/* ── Input field style ── */
const inputCls =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm transition focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-100';

/* ── Section heading ── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-border pb-2 text-sm font-bold text-foreground">
      {children}
    </h3>
  );
}

export function ProductForm({ mode, categories, initial, backHref }: ProductFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  // ── Basic info ──
  const [name, setName] = React.useState(initial?.name ?? '');
  const [slug, setSlug] = React.useState(initial?.slug ?? '');
  const [shortDescription, setShortDescription] = React.useState(initial?.shortDescription ?? '');
  const [description, setDescription] = React.useState(initial?.description ?? '');

  // ── Pricing ──
  const [price, setPrice] = React.useState<string>(
    initial?.price != null ? String(initial.price) : '',
  );
  const [compareAt, setCompareAt] = React.useState<string>(
    initial?.compareAtPrice != null ? String(initial.compareAtPrice) : '',
  );

  // ── Category ──
  const [categoryId, setCategoryId] = React.useState(
    initial?.categoryId ?? categories[0]?.id ?? '',
  );
  const [isTraditional, setIsTraditional] = React.useState<boolean>(
    initial?.isTraditional ?? false,
  );
  const [traditionalCategoryKey, setTraditionalCategoryKey] = React.useState<string>(() => {
    if (initial?.isTraditional) {
      return 'traditional';
    }
    return TRADITIONAL_CATEGORIES[0]?.key ?? 'traditional';
  });

  // ── Inventory ──
  const [stockQuantity, setStockQuantity] = React.useState<string>(
    initial?.stockQuantity != null ? String(initial.stockQuantity) : '0',
  );
  const [isActive, setIsActive] = React.useState<boolean>(initial?.isActive ?? true);

  // ── Physical ──
  const [weightKg, setWeightKg] = React.useState<string>(
    initial?.weightKg != null ? String(initial.weightKg) : '',
  );
  const dims = parseDimensions(initial?.dimensionsJson);
  const [dimLength, setDimLength] = React.useState(dims.length);
  const [dimWidth, setDimWidth] = React.useState(dims.width);
  const [dimHeight, setDimHeight] = React.useState(dims.height);

  // ── Tags ──
  const [tags, setTags] = React.useState<string>(parseTags(initial?.tagsJson));

  // ── Attributes ──
  const [attributes, setAttributes] = React.useState<Attribute[]>(
    parseAttributes(initial?.attributesJson),
  );

  // ── Media ──
  const [whatsappNumber, setWhatsappNumber] = React.useState<string>(
    initial?.whatsappNumber ?? '',
  );
  const [videoUrl, setVideoUrl] = React.useState<string>(initial?.videoUrl ?? '');
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoUploading, setVideoUploading] = React.useState(false);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  // ── Slug auto-gen ──
  const [slugTouched, setSlugTouched] = React.useState(isEdit);
  React.useEffect(() => {
    if (!slugTouched && name) setSlug(slugify(name));
  }, [name, slugTouched]);

  // ── Discount calc ──
  const discountPercent = React.useMemo(() => {
    const p = parseFloat(price);
    const c = parseFloat(compareAt);
    if (p > 0 && c > p) return Math.round(((c - p) / c) * 100);
    return null;
  }, [price, compareAt]);

  // ── Attribute helpers ──
  function addAttribute() {
    setAttributes((a) => [...a, { key: '', value: '' }]);
  }
  function removeAttribute(idx: number) {
    setAttributes((a) => a.filter((_, i) => i !== idx));
  }
  function updateAttribute(idx: number, field: 'key' | 'value', val: string) {
    setAttributes((a) => a.map((attr, i) => (i === idx ? { ...attr, [field]: val } : attr)));
  }

  // ── Video upload ──
  async function uploadVideo(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'video');
    setVideoUploading(true);
    try {
      const res = await fetch('/api/seller/upload', { method: 'POST', body: fd, credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.url) {
        toast.error(json.error ?? 'خطا در آپلود ویدیو');
        return null;
      }
      toast.success('ویدیو آپلود شد');
      return json.url as string;
    } catch {
      toast.error('خطا در اتصال به سرور');
      return null;
    } finally {
      setVideoUploading(false);
    }
  }

  async function onVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate: 10-20 seconds is hard to check client-side without load; validate size instead (max 50MB)
    const maxMB = 50;
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`حجم ویدیو نباید بیش از ${maxMB} مگابایت باشد`);
      return;
    }
    if (!['video/mp4', 'video/webm', 'video/ogg'].includes(file.type)) {
      toast.error('فرمت ویدیو باید MP4، WebM یا Ogg باشد');
      return;
    }
    setVideoFile(file);
    // Validate duration
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (video.duration < 5 || video.duration > 60) {
        toast.warning(`مدت ویدیو: ${Math.round(video.duration)}ث — توصیه: ۱۰ تا ۲۰ ثانیه`);
      }
    };
  }

  // ── Submit ──
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    // Validate
    if (!name.trim()) { toast.error('نام محصول الزامی است'); setBusy(false); return; }
    if (!price || parseFloat(price) <= 0) { toast.error('قیمت باید مثبت باشد'); setBusy(false); return; }
    if (!categoryId) { toast.error('دسته‌بندی الزامی است'); setBusy(false); return; }
    if (!shortDescription.trim()) { toast.error('توضیح کوتاه الزامی است'); setBusy(false); return; }

    let finalVideoUrl = videoUrl;
    if (videoFile) {
      const uploaded = await uploadVideo(videoFile);
      if (uploaded) finalVideoUrl = uploaded;
    }

    // Build tags array
    const tagsArr = tags
      .split(/[،,]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    // Build dimensions
    const dimensionsObj =
      dimLength || dimWidth || dimHeight
        ? {
            length: parseFloat(dimLength) || 0,
            width: parseFloat(dimWidth) || 0,
            height: parseFloat(dimHeight) || 0,
          }
        : null;

    // Build attributes
    const attributesArr = attributes.filter((a) => a.key.trim() && a.value.trim());

    const payload = {
      slug: slug || slugify(name),
      name: name.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim() || null,
      price: parseFloat(price),
      compareAtPrice: compareAt ? parseFloat(compareAt) : null,
      categoryId,
      inStock: parseInt(stockQuantity, 10) > 0,
      isActive,
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      whatsappNumber: whatsappNumber ? cleanWhatsapp(whatsappNumber) : null,
      videoUrl: finalVideoUrl || null,
      isTraditional,
      weightKg: weightKg ? parseFloat(weightKg) : null,
      dimensionsJson: dimensionsObj ? JSON.stringify(dimensionsObj) : null,
      tagsJson: tagsArr.length ? JSON.stringify(tagsArr) : null,
      attributesJson: attributesArr.length ? JSON.stringify(attributesArr) : null,
    };

    const url = isEdit && initial?.id
      ? `/api/seller/products/${initial.id}`
      : '/api/seller/products';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = body?.error?.message ?? body?.message ?? 'خطای سرور';
        toast.error(msg);
        return;
      }
      toast.success(isEdit ? 'محصول به‌روز شد' : 'محصول ثبت شد');
      router.push(backHref);
      router.refresh();
    } catch {
      toast.error('خطا در اتصال به سرور');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* ── Section 1: Basic Info ── */}
      <section className="space-y-4">
        <SectionTitle>اطلاعات پایه</SectionTitle>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            نام محصول <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            required
            maxLength={120}
            placeholder="مثال: قالی دست‌باف هراتی"
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            شناسه URL (Slug)
          </label>
          <input
            type="text"
            dir="ltr"
            value={slug}
            onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); }}
            className={inputCls + ' font-mono text-xs'}
            placeholder="auto-generated-from-name"
          />
          <p className="text-xs text-muted-foreground">در صورت خالی بودن، به‌صورت خودکار از نام تولید می‌شود.</p>
        </div>

        {/* Short Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            توضیح کوتاه <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={300}
            placeholder="یک یا دو جمله کوتاه درباره محصول…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-100"
          />
          <p className="text-xs text-muted-foreground">{shortDescription.length}/300</p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">توضیحات کامل</label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیحات جامع درباره محصول، کاربرد، مواد اولیه و ویژگی‌ها…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-100"
          />
        </div>
      </section>

      {/* ── Section 2: Pricing ── */}
      <section className="space-y-4">
        <SectionTitle>قیمت‌گذاری</SectionTitle>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              قیمت (AFN) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputCls}
              required
              placeholder="مثال: 2500"
            />
          </div>

          {/* Compare at price */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              قیمت قبل از تخفیف (اختیاری)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={compareAt}
              onChange={(e) => setCompareAt(e.target.value)}
              placeholder="مثلاً 3500"
              className={inputCls}
            />
            {discountPercent !== null && (
              <p className="text-xs text-emerald-600 font-medium">
                🏷️ تخفیف {discountPercent}٪ برای مشتری نمایش داده می‌شود
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 3: Category ── */}
      <section className="space-y-4">
        <SectionTitle>دسته‌بندی</SectionTitle>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            دسته‌بندی <span className="text-rose-500">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputCls}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Traditional toggle */}
        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors">
          <input
            type="checkbox"
            checked={isTraditional}
            onChange={(e) => setIsTraditional(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-rose-600"
          />
          <div>
            <span className="text-sm font-medium text-foreground">محصول سنتی افغانستانی</span>
            <p className="text-xs text-muted-foreground">
              محصول در بخش ویژه محصولات سنتی نمایش داده می‌شود.
            </p>
          </div>
        </label>

        {isTraditional && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">زیردسته سنتی</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {TRADITIONAL_CATEGORIES.map((tc) => (
                <button
                  key={tc.key}
                  type="button"
                  onClick={() => setTraditionalCategoryKey(tc.key)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs transition-colors ${
                    traditionalCategoryKey === tc.key
                      ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
                      : 'border-border hover:border-rose-300 hover:bg-muted/50'
                  }`}
                >
                  <span className="text-lg">{tc.emoji}</span>
                  <span className="font-medium">{tc.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Section 4: Inventory ── */}
      <section className="space-y-4">
        <SectionTitle>موجودی و وضعیت</SectionTitle>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">تعداد موجودی</label>
            <input
              type="number"
              step="1"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground">
              صفر یعنی ناموجود — محصول از فروشگاه خارج می‌شود.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">وضعیت انتشار</label>
            <select
              value={isActive ? 'active' : 'inactive'}
              onChange={(e) => setIsActive(e.target.value === 'active')}
              className={inputCls}
            >
              <option value="active">فعال (نمایش در فروشگاه)</option>
              <option value="inactive">غیرفعال (پنهان)</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Section 5: Physical specs ── */}
      <section className="space-y-4">
        <SectionTitle>ابعاد و وزن</SectionTitle>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">وزن (کیلوگرم)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className={inputCls}
              placeholder="مثال: 1.5"
              dir="ltr"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">ابعاد (سانتی‌متر)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                value={dimLength}
                onChange={(e) => setDimLength(e.target.value)}
                className={inputCls + ' flex-1'}
                placeholder="طول"
                dir="ltr"
              />
              <input
                type="number"
                step="0.1"
                min="0"
                value={dimWidth}
                onChange={(e) => setDimWidth(e.target.value)}
                className={inputCls + ' flex-1'}
                placeholder="عرض"
                dir="ltr"
              />
              <input
                type="number"
                step="0.1"
                min="0"
                value={dimHeight}
                onChange={(e) => setDimHeight(e.target.value)}
                className={inputCls + ' flex-1'}
                placeholder="ارتفاع"
                dir="ltr"
              />
            </div>
            <p className="text-xs text-muted-foreground">طول × عرض × ارتفاع (cm)</p>
          </div>
        </div>
      </section>

      {/* ── Section 6: Tags ── */}
      <section className="space-y-4">
        <SectionTitle>تگ‌ها و برچسب‌ها</SectionTitle>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">تگ‌ها</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputCls}
            placeholder="مثال: ارگانیک، دست‌ساز، هراتی، ارزان"
          />
          <p className="text-xs text-muted-foreground">
            تگ‌ها را با ویرگول (،) از هم جدا کنید. در جستجوی محصولات تأثیرگذار است.
          </p>
          {tags && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.split(/[،,]+/).filter((t) => t.trim()).map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-300"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Section 7: Attributes ── */}
      <section className="space-y-4">
        <SectionTitle>ویژگی‌ها و مشخصات فنی</SectionTitle>

        <div className="space-y-2">
          {attributes.map((attr, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={attr.key}
                onChange={(e) => updateAttribute(idx, 'key', e.target.value)}
                placeholder="نام ویژگی (مثال: جنس)"
                className={inputCls + ' flex-1'}
              />
              <input
                type="text"
                value={attr.value}
                onChange={(e) => updateAttribute(idx, 'value', e.target.value)}
                placeholder="مقدار (مثال: پشم)"
                className={inputCls + ' flex-1'}
              />
              <button
                type="button"
                onClick={() => removeAttribute(idx)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                aria-label="حذف ویژگی"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAttribute}
            className="mt-1"
          >
            <Plus className="h-4 w-4" />
            افزودن ویژگی
          </Button>
          {attributes.length === 0 && (
            <p className="text-xs text-muted-foreground">
              مثال: جنس → پشم، رنگ → قرمز، اندازه → ۳×۲ متر
            </p>
          )}
        </div>
      </section>

      {/* ── Section 8: Images ── */}
      <section className="space-y-4">
        <SectionTitle>تصاویر محصول (حداقل ۳ تصویر)</SectionTitle>
        <p className="text-xs text-muted-foreground">
          حداقل ۳ تصویر با کیفیت مناسب آپلود کنید. تصویر اصلی که در لیست نمایش داده می‌شود را مشخص کنید.
        </p>
        {isEdit && initial?.id ? (
          <ProductImagesEditor
            productId={initial.id}
            initial={initial.images ?? []}
            initialPrimaryIndex={initial.primaryImageIndex ?? 0}
          />
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            پس از ثبت محصول، امکان آپلود تصویر فعال می‌شود.
          </div>
        )}
      </section>

      {/* ── Section 9: Video ── */}
      <section className="space-y-4">
        <SectionTitle>ویدیوی معرفی محصول (۱۰ تا ۲۰ ثانیه)</SectionTitle>

        {/* Video URL */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">لینک ویدیو (اختیاری)</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... یا لینک مستقیم .mp4"
            className={inputCls}
          />
        </div>

        {/* Or file upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">یا آپلود مستقیم ویدیو</label>
          <div className="flex items-center gap-3">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg"
              className="hidden"
              onChange={onVideoFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => videoInputRef.current?.click()}
              disabled={videoUploading}
            >
              {videoUploading ? 'در حال آپلود…' : 'انتخاب فایل ویدیو'}
            </Button>
            {videoFile && (
              <span className="text-xs text-emerald-600 font-medium">
                ✓ {videoFile.name} انتخاب شد
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            فرمت: MP4، WebM — توصیه: ۱۰ تا ۲۰ ثانیه — حداکثر: ۵۰ مگابایت
          </p>
          {(videoUrl || videoFile) && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              ویدیو در صفحه محصول نمایش داده خواهد شد
            </p>
          )}
        </div>
      </section>

      {/* ── Section 10: Contact ── */}
      <section className="space-y-4">
        <SectionTitle>اطلاعات تماس</SectionTitle>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">شماره واتساپ فروشنده</label>
          <input
            type="tel"
            dir="ltr"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(cleanWhatsapp(e.target.value))}
            placeholder="+93XXXXXXXXX"
            className={inputCls}
          />
          <p className="text-xs text-muted-foreground">
            مشتریان می‌توانند مستقیماً از صفحه محصول با شما تماس بگیرند.
          </p>
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
          انصراف
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={busy}
          className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
        >
          {busy ? 'در حال ذخیره…' : isEdit ? 'ذخیره تغییرات' : 'ثبت محصول'}
        </Button>
      </div>
    </form>
  );
}
