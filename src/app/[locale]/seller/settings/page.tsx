import { setRequestLocale } from 'next-intl/server';
import { StoreSettingsForm } from '@/features/seller/components/store-settings-form';
import { StoreDeactivateControl } from '@/features/seller/components/store-deactivate-control';
import { requireSeller } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export default async function SellerSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSeller({ locale });

  return <div className="mx-auto max-w-4xl space-y-5 px-4 py-6" dir="rtl">
    <style>{`input[type="url"][placeholder="یا لینک URL"]{display:none!important}`}</style>
    <header><h1 className="text-2xl font-bold text-foreground">تنظیمات فروشگاه</h1><p className="mt-1 text-sm text-muted-foreground">اطلاعات فروشگاه، تصاویر، راه‌های تماس و حساب‌های تسویه را مدیریت کنید. برند در بخش مستقل «برند من» قرار دارد.</p></header>
    <StoreSettingsForm />
    <section className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5"><h2 className="text-sm font-black">مدیریت فروشگاه</h2><p className="mt-1 mb-4 text-xs leading-6 text-muted-foreground">برای توقف نمایش عمومی فروشگاه، آن را غیرفعال کنید. محصولات و سابقه سفارش‌ها حذف نمی‌شوند.</p><StoreDeactivateControl /></section>
  </div>;
}
