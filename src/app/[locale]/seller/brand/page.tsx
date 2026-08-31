import { setRequestLocale } from 'next-intl/server';
import { requireSeller } from '@/lib/auth/roles';
import { BrandSettingsForm } from '@/features/seller/components/brand-settings-form';
import { SellerBrandManager } from '@/features/seller/components/seller-brand-manager';
export const dynamic='force-dynamic';
export default async function SellerBrandPage({params}:{params:Promise<{locale:string}>}){const {locale}=await params;setRequestLocale(locale);await requireSeller({locale});return <div className="mx-auto max-w-4xl space-y-5 px-4 py-6" dir="rtl"><header><h1 className="text-2xl font-black text-foreground">برند من</h1><p className="mt-1 text-sm text-muted-foreground">برند اختصاصی شما و محصولاتی که در صفحه برند نمایش داده می‌شوند.</p></header><BrandSettingsForm/><SellerBrandManager/></div>}
