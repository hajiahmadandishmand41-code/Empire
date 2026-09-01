import { setRequestLocale } from 'next-intl/server';
import { requireSeller } from '@/lib/auth/roles';
import { BrandSettingsForm } from '@/features/seller/components/brand-settings-form';
import { Link } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function SellerBrandPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSeller({ locale });
  return <div className="mx-auto max-w-4xl space-y-5 px-4 py-6" dir="rtl"><header><h1 className="text-2xl font-black">برند من</h1><p className="mt-1 text-sm text-muted-foreground">برند کاملاً مستقل از فروشگاه است و فقط با ایجاد صریح شما فعال می‌شود.</p></header><BrandSettingsForm /><div className="rounded-2xl border border-border bg-muted/20 p-4 text-xs leading-6 text-muted-foreground">محصولات جدید به‌صورت پیش‌فرض فقط به فروشنده و فروشگاه شما تعلق دارند. هنگام ثبت محصول، برند را فقط در صورت نیاز انتخاب کنید.</div><Link href={`/${locale}/seller/products`} className="inline-flex rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold hover:bg-muted">مدیریت محصولات</Link></div>;
}
