'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, Plus, Minus, Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Shape of data handled by ProductForm */
export interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  price: string | number;
  comparePrice: string | number;
  discountPercent: number;
  discountAmount: number;
  stock: number | string;
  sku: string;
  barcode: string;
  categoryId: string;
  weight: string | number;
  width: string | number;
  height: string | number;
  depth: string | number;
  status: string;
  isFeatured: boolean;
  tags?: string[] | string;
  attributes?: Record<string, unknown> | string;
  images?: string[] | string;
  mainImage?: string;
  video?: string;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData & { tags: string[]; attributes: Record<string, string>; images: string[]; mainImage: string; video: string }) => Promise<void>;
}

export default function ProductForm({ initialData, onSubmit }: ProductFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    shortDescription: initialData?.shortDescription || '',
    price: initialData?.price || '',
    comparePrice: initialData?.comparePrice || '',
    discountPercent: initialData?.discountPercent || 0,
    discountAmount: initialData?.discountAmount || 0,
    stock: initialData?.stock || 0,
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    categoryId: initialData?.categoryId || '',
    weight: initialData?.weight || '',
    width: initialData?.width || '',
    height: initialData?.height || '',
    depth: initialData?.depth || '',
    status: initialData?.status || 'active',
    isFeatured: initialData?.isFeatured || false,
  });

  const [tags, setTags] = useState<string[]>(
    initialData?.tags ? (typeof initialData.tags === 'string' ? JSON.parse(initialData.tags) : initialData.tags) : []
  );
  const [tagInput, setTagInput] = useState('');

  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>(
    initialData?.attributes
      ? Object.entries(
          typeof initialData.attributes === 'string' ? JSON.parse(initialData.attributes) : initialData.attributes
        ).map(([key, value]) => ({ key, value: String(value) }))
      : [{ key: '', value: '' }]
  );

  const [images, setImages] = useState<string[]>(
    initialData?.images ? (typeof initialData.images === 'string' ? JSON.parse(initialData.images) : initialData.images) : []
  );
  const [mainImage, setMainImage] = useState<string>(initialData?.mainImage || '');
  const [video, setVideo] = useState<string>(initialData?.video || '');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'نام محصول الزامی است';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) errs.price = 'قیمت صحیح وارد کنید';
    if (form.stock !== '' && isNaN(Number(form.stock))) errs.stock = 'موجودی باید عدد باشد';
    if (images.length < 1) errs.images = 'حداقل ۱ تصویر الزامی است';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingImages(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'image');
        const res = await fetch('/api/seller/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) urls.push(data.url);
      }
      const newImages = [...images, ...urls];
      setImages(newImages);
      if (!mainImage && newImages.length > 0) setMainImage(newImages[0]);
    } catch (err) {
      alert('خطا در آپلود تصویر');
    } finally {
      setUploadingImages(false);
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoError('');

    // Check duration
    const url = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.src = url;
    await new Promise(r => vid.addEventListener('loadedmetadata', r));
    const duration = vid.duration;
    URL.revokeObjectURL(url);

    if (duration < 10 || duration > 20) {
      setVideoError(`مدت ویدیو باید بین ۱۰ تا ۲۰ ثانیه باشد (مدت فعلی: ${Math.round(duration)} ثانیه)`);
      return;
    }

    setUploadingVideo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'video');
      const res = await fetch('/api/seller/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setVideo(data.url);
    } catch (err) {
      alert('خطا در آپلود ویدیو');
    } finally {
      setUploadingVideo(false);
    }
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag));
  }

  function addAttribute() {
    setAttributes([...attributes, { key: '', value: '' }]);
  }

  function updateAttribute(i: number, field: 'key' | 'value', val: string) {
    const updated = [...attributes];
    updated[i][field] = val;
    setAttributes(updated);
  }

  function removeAttribute(i: number) {
    setAttributes(attributes.filter((_, idx) => idx !== i));
  }

  function removeImage(url: string) {
    const newImages = images.filter(img => img !== url);
    setImages(newImages);
    if (mainImage === url) setMainImage(newImages[0] || '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSuccess('');
    try {
      const attrsObj = attributes.reduce((acc, a) => {
        if (a.key.trim()) acc[a.key.trim()] = a.value;
        return acc;
      }, {} as Record<string, string>);

      await onSubmit({
        ...form,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : '',
        stock: Number(form.stock) || 0,
        tags,
        attributes: attrsObj,
        images,
        mainImage: mainImage || images[0] || '',
        video: video || '',
      });
      setSuccess('محصول با موفقیت ذخیره شد');
    } catch (err: unknown) {
      setErrors({ submit: (err instanceof Error ? err.message : undefined) || 'خطا در ذخیره محصول' });
    } finally {
      setSubmitting(false);
    }
  }

  function update(field: string, value: string | number | boolean) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  const inputCls = (err?: string) => cn(
    'w-full px-3 py-2.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 transition-colors',
    err ? 'border-destructive focus:ring-destructive/30' : 'border-border focus:ring-primary/30'
  );

  const sectionCls = 'bg-card rounded-xl border border-border p-5';
  const labelCls = 'block text-sm font-medium text-foreground mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Basic Info */}
      <div className={sectionCls}>
        <h2 className="font-semibold text-base mb-4 pb-3 border-b border-border">اطلاعات پایه</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>نام محصول <span className="text-destructive">*</span></label>
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)} className={inputCls(errors.name)} placeholder="نام محصول را وارد کنید" />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>توضیحات کوتاه</label>
            <input type="text" value={form.shortDescription} onChange={e => update('shortDescription', e.target.value)} className={inputCls()} placeholder="یک خط توضیح مختصر" />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>توضیحات کامل</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} className={cn(inputCls(), 'resize-none h-28')} placeholder="توضیحات کامل محصول..." />
          </div>

          <div>
            <label className={labelCls}>کد محصول (SKU)</label>
            <input type="text" value={form.sku} onChange={e => update('sku', e.target.value)} className={inputCls()} placeholder="مثال: SKU-001" />
          </div>
          <div>
            <label className={labelCls}>بارکد</label>
            <input type="text" value={form.barcode} onChange={e => update('barcode', e.target.value)} className={inputCls()} placeholder="بارکد محصول" />
          </div>
        </div>
      </div>

      {/* Price */}
      <div className={sectionCls}>
        <h2 className="font-semibold text-base mb-4 pb-3 border-b border-border">قیمت و تخفیف</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>قیمت (تومان) <span className="text-destructive">*</span></label>
            <input type="number" value={form.price} onChange={e => update('price', e.target.value)} className={inputCls(errors.price)} placeholder="0" min="0" />
            {errors.price && <p className="text-destructive text-xs mt-1">{errors.price}</p>}
          </div>
          <div>
            <label className={labelCls}>قیمت قبل از تخفیف</label>
            <input type="number" value={form.comparePrice} onChange={e => update('comparePrice', e.target.value)} className={inputCls()} placeholder="0" min="0" />
          </div>
          <div>
            <label className={labelCls}>درصد تخفیف</label>
            <input type="number" value={form.discountPercent} onChange={e => update('discountPercent', Number(e.target.value))} className={inputCls()} min="0" max="100" />
          </div>
          <div>
            <label className={labelCls}>تخفیف مقداری (تومان)</label>
            <input type="number" value={form.discountAmount} onChange={e => update('discountAmount', Number(e.target.value))} className={inputCls()} min="0" />
          </div>
        </div>
      </div>

      {/* Stock */}
      <div className={sectionCls}>
        <h2 className="font-semibold text-base mb-4 pb-3 border-b border-border">موجودی و وضعیت</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>موجودی انبار</label>
            <input type="number" value={form.stock} onChange={e => update('stock', e.target.value)} className={inputCls(errors.stock)} min="0" />
            {errors.stock && <p className="text-destructive text-xs mt-1">{errors.stock}</p>}
          </div>
          <div>
            <label className={labelCls}>وضعیت</label>
            <select value={form.status} onChange={e => update('status', e.target.value)} className={inputCls()}>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
              <option value="draft">پیش‌نویس</option>
              <option value="out_of_stock">ناموجود</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => update('isFeatured', !form.isFeatured)}
                className={cn(
                  'w-12 h-6 rounded-full transition-colors relative',
                  form.isFeatured ? 'bg-primary' : 'bg-muted'
                )}
              >
                <div className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow',
                  form.isFeatured ? 'right-1' : 'left-1'
                )} />
              </div>
              <span className="text-sm font-medium">محصول ویژه</span>
            </label>
          </div>
        </div>
      </div>

      {/* Physical */}
      <div className={sectionCls}>
        <h2 className="font-semibold text-base mb-4 pb-3 border-b border-border">مشخصات فیزیکی</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>وزن (kg)</label>
            <input type="number" value={form.weight} onChange={e => update('weight', e.target.value)} className={inputCls()} step="0.01" min="0" placeholder="0.0" />
          </div>
          <div>
            <label className={labelCls}>عرض (cm)</label>
            <input type="number" value={form.width} onChange={e => update('width', e.target.value)} className={inputCls()} step="0.1" min="0" placeholder="0.0" />
          </div>
          <div>
            <label className={labelCls}>ارتفاع (cm)</label>
            <input type="number" value={form.height} onChange={e => update('height', e.target.value)} className={inputCls()} step="0.1" min="0" placeholder="0.0" />
          </div>
          <div>
            <label className={labelCls}>عمق (cm)</label>
            <input type="number" value={form.depth} onChange={e => update('depth', e.target.value)} className={inputCls()} step="0.1" min="0" placeholder="0.0" />
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <h2 className="font-semibold text-base">ویژگی‌ها</h2>
          <button type="button" onClick={addAttribute} className="flex items-center gap-1 text-sm text-primary hover:underline">
            <Plus className="w-3.5 h-3.5" /> افزودن ویژگی
          </button>
        </div>
        <div className="space-y-2">
          {attributes.map((attr, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="نام ویژگی (مثال: رنگ)"
                value={attr.key}
                onChange={e => updateAttribute(i, 'key', e.target.value)}
                className={cn(inputCls(), 'flex-1')}
              />
              <input
                type="text"
                placeholder="مقدار (مثال: مشکی)"
                value={attr.value}
                onChange={e => updateAttribute(i, 'value', e.target.value)}
                className={cn(inputCls(), 'flex-1')}
              />
              <button type="button" onClick={() => removeAttribute(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                <Minus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className={sectionCls}>
        <h2 className="font-semibold text-base mb-4 pb-3 border-b border-border">تگ‌ها</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            className={cn(inputCls(), 'flex-1')}
            placeholder="تگ را وارد کنید و Enter بزنید"
          />
          <button type="button" onClick={addTag} className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
            افزودن
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-sm">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div className={sectionCls}>
        <h2 className="font-semibold text-base mb-4 pb-3 border-b border-border">
          تصاویر محصول
          <span className="text-xs text-muted-foreground font-normal mr-2">(حداقل ۳ تصویر توصیه می‌شود)</span>
        </h2>

        {errors.images && (
          <div className="flex items-center gap-2 text-destructive text-sm mb-3 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errors.images}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
          {images.map((img, i) => (
            <div
              key={img}
              className={cn(
                'relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all',
                mainImage === img ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
              )}
              onClick={() => setMainImage(img)}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
              {mainImage === img && (
                <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
                  <Star className="w-3 h-3" />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(img); }}
                className="absolute top-1 left-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImages}
            className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            {uploadingImages ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-xs">آپلود تصویر</span>
              </>
            )}
          </button>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
        {mainImage && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Star className="w-3 h-3 text-primary" />
            روی تصویر کلیک کنید تا به عنوان تصویر اصلی انتخاب شود
          </p>
        )}
      </div>

      {/* Video */}
      <div className={sectionCls}>
        <h2 className="font-semibold text-base mb-4 pb-3 border-b border-border">
          ویدیو محصول
          <span className="text-xs text-muted-foreground font-normal mr-2">(۱۰ تا ۲۰ ثانیه)</span>
        </h2>

        {videoError && (
          <div className="flex items-center gap-2 text-destructive text-sm mb-3 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {videoError}
          </div>
        )}

        {video ? (
          <div className="relative">
            <video src={video} controls className="w-full max-h-48 rounded-lg bg-black" />
            <button
              type="button"
              onClick={() => setVideo('')}
              className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploadingVideo}
            className="w-full py-8 border-2 border-dashed border-border rounded-lg flex flex-col items-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
          >
            {uploadingVideo ? (
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Video className="w-8 h-8" />
                <span className="text-sm">بارگذاری ویدیو (فرمت MP4، حداکثر ۱۰۰MB، ۱۰-۲۰ ثانیه)</span>
              </>
            )}
          </button>
        )}

        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleVideoUpload}
        />
      </div>

      {/* Submit */}
      {errors.submit && (
        <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errors.submit}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-emerald-700 p-4 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 sm:flex-none px-8 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {initialData ? 'ذخیره تغییرات' : 'ثبت محصول'}
        </button>
        <button
          type="button"
          onClick={() => history.back()}
          className="px-6 py-2.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}
