import { setRequestLocale } from 'next-intl/server';
import { StoreSettingsForm } from '@/features/seller/components/store-settings-form';
import { StoreDeactivateControl } from '@/features/seller/components/store-deactivate-control';
import { requireSeller } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export default async function SellerSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSeller({ locale });

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6" dir="rtl">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-black text-foreground">تنظیمات فروشگاه</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
          هویت فروشگاه، تصاویر، اطلاعات تماس، شبکه‌های اجتماعی و حساب‌های تسویه را از یک نقطه مدیریت کنید.
          بعد از آپلود لوگو یا بنر، فایل فوراً در سرور و پایگاه داده ثبت می‌شود و با ذخیره فرم، همه تغییرات متنی نیز اتمیک ذخیره خواهند شد.
        </p>
      </header>
      <StoreSettingsForm />
      <section className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5">
        <h2 className="text-sm font-black">مدیریت وضعیت فروشگاه</h2>
        <p className="mb-4 mt-1 text-xs leading-6 text-muted-foreground">
          با غیرفعال‌کردن فروشگاه، ویترین عمومی متوقف می‌شود؛ محصولات و سابقه سفارش‌ها حذف نمی‌شوند.
        </p>
        <StoreDeactivateControl />
      </section>
    </div>
  );
}
