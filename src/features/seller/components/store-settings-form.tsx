'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Wallet,
  Store,
  Phone,
  MapPin,
  FileText,
  Image as ImageIcon,
  Landmark,
  CreditCard,
  Instagram,
  Globe,
  Send,
  Facebook,
  Linkedin,
  Upload,
} from 'lucide-react';

interface StoreSettings {
  sellerShopName?: string | null;
  sellerBio?: string | null;
  sellerLogoUrl?: string | null;
  sellerBannerUrl?: string | null;
  sellerWhatsapp?: string | null;
  sellerContactEmail?: string | null;
  sellerContactPhone?: string | null;
  sellerAddress?: string | null;
  sellerCity?: string | null;
  sellerCountry?: string | null;
  // Payment account info
  sellerBankAccountNumber?: string | null;
  sellerBankAccountName?: string | null;
  sellerBankName?: string | null;
  sellerAtomaPay?: string | null;
  // Social media
  sellerInstagram?: string | null;
  sellerTelegram?: string | null;
  sellerFacebook?: string | null;
  sellerLinkedin?: string | null;
  sellerWebsite?: string | null;
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-2 mb-4">
      <Icon className="h-4 w-4 text-rose-500" aria-hidden />
      <h2 className="text-sm font-bold text-foreground">{children}</h2>
    </div>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  name,
  label,
  type = 'text',
  textarea = false,
  dir,
  placeholder,
  value,
  onChange,
  hint,
  full,
}: {
  name: string;
  label: string;
  type?: string;
  textarea?: boolean;
  dir?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  full?: boolean;
}) {
  const cls =
    'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20';

  return (
    <label className={full ? 'block sm:col-span-2' : 'block'}>
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          dir={dir}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={cls}
        />
      ) : (
        <input
          type={type}
          name={name}
          dir={dir}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </label>
  );
}

function ImageUploader({
  label,
  hint,
  value,
  onChange,
  aspect,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: 'square' | 'banner';
}) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم فایل نباید بیشتر از ۵ مگابایت باشد');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'image');
      const res = await fetch('/api/seller/upload', { method: 'POST', body: fd, credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.url) {
        toast.error(json.error ?? 'خطا در آپلود');
        return;
      }
      onChange(json.url);
      toast.success('تصویر آپلود شد');
    } catch {
      toast.error('خطا در اتصال به سرور');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        {value ? (
          <div
            className={`relative overflow-hidden rounded-lg border border-border bg-muted/30 ${
              aspect === 'banner' ? 'h-20 w-40' : 'h-16 w-16'
            }`}
          >
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div
            className={`flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 text-muted-foreground ${
              aspect === 'banner' ? 'h-20 w-40' : 'h-16 w-16'
            }`}
          >
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
        <div className="space-y-1.5">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="h-8 rounded-lg px-3 text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? 'در حال آپلود…' : value ? 'تغییر تصویر' : 'آپلود تصویر'}
          </Button>
          {value && (
            <div className="w-full max-w-[200px]">
              <input
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="یا لینک URL"
                dir="ltr"
                className="h-7 w-full rounded-lg border border-border bg-background px-2 text-[11px] text-muted-foreground outline-none focus:border-rose-400"
              />
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );
}

export function StoreSettingsForm() {
  const [values, setValues] = React.useState<StoreSettings>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/seller/settings', { credentials: 'include' });
        const json = await res.json();
        if (json?.ok && json.data) setValues(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onChange = (name: keyof StoreSettings, v: string) =>
    setValues((s) => ({ ...s, [name]: v }));

  const v = (name: keyof StoreSettings) => values[name] ?? '';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(values)) {
        payload[k] = typeof val === 'string' && val.trim() === '' ? null : val;
      }
      const res = await fetch('/api/seller/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error?.message ?? 'خطا در ذخیره');
        return;
      }
      toast.success('تنظیمات فروشگاه ذخیره شد');
    } catch {
      toast.error('خطا در اتصال به سرور');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* ── Shop Identity ── */}
      <section className="space-y-4">
        <SectionTitle icon={Store}>هویت فروشگاه</SectionTitle>
        <Field
          name="sellerShopName"
          label="نام فروشگاه"
          placeholder="نام فروشگاه شما"
          full
          value={v('sellerShopName')}
          onChange={(val) => onChange('sellerShopName', val)}
        />
        <Field
          name="sellerBio"
          label="معرفی کوتاه فروشگاه"
          textarea
          placeholder="چند جمله درباره فروشگاه، تخصص و مزیت‌های شما…"
          full
          value={v('sellerBio')}
          onChange={(val) => onChange('sellerBio', val)}
        />
      </section>

      {/* ── Logo & Banner ── */}
      <section className="space-y-5">
        <SectionTitle icon={ImageIcon}>تصاویر فروشگاه</SectionTitle>
        <ImageUploader
          label="لوگو فروشگاه (مربع — ۱:۱)"
          hint="حداقل ۲۰۰×۲۰۰ پیکسل — PNG/JPG — حداکثر ۵ مگابایت"
          aspect="square"
          value={v('sellerLogoUrl')}
          onChange={(url) => onChange('sellerLogoUrl', url)}
        />
        <ImageUploader
          label="بنر فروشگاه (عرضی — ۱۶:۹ یا ۳:۱)"
          hint="حداقل ۱۲۰۰×۴۰۰ پیکسل — PNG/JPG — حداکثر ۵ مگابایت"
          aspect="banner"
          value={v('sellerBannerUrl')}
          onChange={(url) => onChange('sellerBannerUrl', url)}
        />
      </section>

      {/* ── Contact ── */}
      <section className="space-y-4">
        <SectionTitle icon={Phone}>اطلاعات تماس</SectionTitle>
        <FieldGroup>
          <Field
            name="sellerContactPhone"
            label="شماره تماس"
            type="tel"
            dir="ltr"
            placeholder="+93XXXXXXXXX"
            value={v('sellerContactPhone')}
            onChange={(val) => onChange('sellerContactPhone', val)}
          />
          <Field
            name="sellerWhatsapp"
            label="شماره واتساپ"
            type="tel"
            dir="ltr"
            placeholder="+93XXXXXXXXX"
            value={v('sellerWhatsapp')}
            onChange={(val) => onChange('sellerWhatsapp', val)}
          />
          <Field
            name="sellerContactEmail"
            label="ایمیل تماس"
            type="email"
            dir="ltr"
            placeholder="shop@example.com"
            value={v('sellerContactEmail')}
            onChange={(val) => onChange('sellerContactEmail', val)}
          />
        </FieldGroup>
      </section>

      {/* ── Address ── */}
      <section className="space-y-4">
        <SectionTitle icon={MapPin}>آدرس</SectionTitle>
        <FieldGroup>
          <Field
            name="sellerCountry"
            label="کشور"
            placeholder="افغانستان"
            value={v('sellerCountry')}
            onChange={(val) => onChange('sellerCountry', val)}
          />
          <Field
            name="sellerCity"
            label="شهر"
            placeholder="کابل"
            value={v('sellerCity')}
            onChange={(val) => onChange('sellerCity', val)}
          />
          <Field
            name="sellerAddress"
            label="آدرس کامل"
            textarea
            full
            placeholder="نشانی کامل فروشگاه یا انبار…"
            value={v('sellerAddress')}
            onChange={(val) => onChange('sellerAddress', val)}
          />
        </FieldGroup>
      </section>

      {/* ── Social Media ── */}
      <section className="space-y-4">
        <SectionTitle icon={Globe}>شبکه‌های اجتماعی</SectionTitle>
        <FieldGroup>
          <Field
            name="sellerInstagram"
            label="اینستاگرام"
            dir="ltr"
            placeholder="@yourshop یا https://instagram.com/yourshop"
            value={v('sellerInstagram')}
            onChange={(val) => onChange('sellerInstagram', val)}
          />
          <Field
            name="sellerTelegram"
            label="تلگرام"
            dir="ltr"
            placeholder="@yourtelegram یا https://t.me/yourshop"
            value={v('sellerTelegram')}
            onChange={(val) => onChange('sellerTelegram', val)}
          />
          <Field
            name="sellerFacebook"
            label="فیسبوک"
            dir="ltr"
            placeholder="https://facebook.com/yourpage"
            value={v('sellerFacebook')}
            onChange={(val) => onChange('sellerFacebook', val)}
          />
          <Field
            name="sellerLinkedin"
            label="لینکدین"
            dir="ltr"
            placeholder="https://linkedin.com/in/yourprofile"
            value={v('sellerLinkedin')}
            onChange={(val) => onChange('sellerLinkedin', val)}
          />
          <Field
            name="sellerWebsite"
            label="وب‌سایت"
            type="url"
            dir="ltr"
            placeholder="https://yourwebsite.com"
            full
            value={v('sellerWebsite')}
            onChange={(val) => onChange('sellerWebsite', val)}
          />
        </FieldGroup>
      </section>

      {/* ── Payment Accounts ── */}
      <section className="space-y-4">
        <SectionTitle icon={CreditCard}>حساب‌های بانکی و دریافت تسویه</SectionTitle>

        {/* Bank */}
        <div className="rounded-xl bg-muted/30 border border-border/60 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Landmark className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground">حساب بانکی</span>
          </div>
          <FieldGroup>
            <Field
              name="sellerBankName"
              label="نام بانک"
              placeholder="بانک ملی، کابل بانک، آزیزی بانک…"
              value={v('sellerBankName')}
              onChange={(val) => onChange('sellerBankName', val)}
            />
            <Field
              name="sellerBankAccountNumber"
              label="شماره حساب"
              dir="ltr"
              placeholder="XXXXXXXXXXXXXXXXXX"
              value={v('sellerBankAccountNumber')}
              onChange={(val) => onChange('sellerBankAccountNumber', val)}
            />
            <Field
              name="sellerBankAccountName"
              label="نام صاحب حساب"
              placeholder="نام کامل به فارسی یا انگلیسی"
              full
              value={v('sellerBankAccountName')}
              onChange={(val) => onChange('sellerBankAccountName', val)}
              hint="باید با نام ثبت‌شده در بانک مطابقت داشته باشد"
            />
          </FieldGroup>
        </div>

        {/* ATOMA Pay */}
        <div className="rounded-xl bg-muted/30 border border-border/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground">ATOMA Pay</span>
          </div>
          <Field
            name="sellerAtomaPay"
            label="شناسه یا شماره ATOMA Pay"
            dir="ltr"
            placeholder="+93XXXXXXXXX یا ATOMA@yourstore"
            value={v('sellerAtomaPay')}
            onChange={(val) => onChange('sellerAtomaPay', val)}
            hint="شماره موبایل یا آدرس کیف پول ATOMA Pay شما"
          />
        </div>

        <p className="text-[11px] text-muted-foreground">
          پس از ذخیره اطلاعات، هنگام ثبت درخواست برداشت این اطلاعات به‌صورت خودکار در فرم پر می‌شوند.
        </p>
      </section>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" disabled={saving} className="h-10 px-8 rounded-xl">
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              در حال ذخیره…
            </span>
          ) : (
            'ذخیره تغییرات'
          )}
        </Button>
      </div>
    </form>
  );
}
