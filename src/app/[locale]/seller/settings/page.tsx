import { setRequestLocale } from 'next-intl/server';
import { StoreSettingsForm } from '@/features/seller/components/store-settings-form';
import { BrandSettingsForm } from '@/features/seller/components/brand-settings-form';
import { requireSeller } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export default async function SellerSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSeller({ locale });

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">تنظیمات فروشگاه</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          اطلاعات فروشگاه، برند اختصاصی، تصاویر، راه‌های تماس و حساب‌های تسویه را مدیریت کنید.
        </p>
      </header>
      <StoreSettingsForm />
      <BrandSettingsForm />
    </div>
  );
}
