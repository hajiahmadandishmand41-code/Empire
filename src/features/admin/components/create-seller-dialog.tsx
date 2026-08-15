'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserPlus, X, Eye, EyeOff } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function CreateSellerDialog({ onClose }: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [form, setForm] = React.useState({
    fullName: '',
    email: '',
    phone: '',
    shopName: '',
    password: '',
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.shopName.trim() || !form.password) {
      toast.error('نام، نام فروشگاه و رمز عبور الزامی هستند');
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      toast.error('ایمیل یا شماره تماس الزامی است');
      return;
    }
    if (form.password.length < 8) {
      toast.error('رمز عبور باید حداقل ۸ کاراکتر باشد');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/admin/sellers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          shopName: form.shopName.trim(),
          password: form.password,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error?.message ?? 'خطا در ایجاد فروشنده');
        return;
      }
      toast.success('فروشنده با موفقیت ایجاد شد');
      router.refresh();
      onClose();
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
              <UserPlus className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">ایجاد فروشنده جدید</h2>
              <p className="text-[11px] text-muted-foreground">توسط مدیر سیستم</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label="بستن"
          >
            <X className="h-4 w-4 text-muted-foreground" aria-hidden />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              نام کامل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="نام و نام خانوادگی فروشنده"
              required
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              نام فروشگاه <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.shopName}
              onChange={(e) => update('shopName', e.target.value)}
              placeholder="نام فروشگاه"
              required
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">ایمیل</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">شماره تماس</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+93..."
                dir="ltr"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-1">حداقل یکی از دو فیلد بالا الزامی است</p>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              رمز عبور <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="حداقل ۸ کاراکتر"
                required
                minLength={8}
                dir="ltr"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" aria-hidden />
                  : <Eye className="h-4 w-4" aria-hidden />
                }
              </button>
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-3">
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
              این حساب مستقیماً با نقش <strong>فروشنده</strong> ایجاد می‌شود و نیازی به تأیید درخواست ندارد.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex h-9 items-center rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-sm"
            >
              {busy
                ? <span className="flex h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                : <UserPlus className="h-3.5 w-3.5" aria-hidden />
              }
              ایجاد فروشنده
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
