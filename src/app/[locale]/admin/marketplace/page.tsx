import { getTranslations } from 'next-intl/server';
import { MarketplaceControls } from '@/features/admin/components/marketplace-controls';

export const dynamic = 'force-dynamic';

export default async function AdminMarketplacePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('admin');
  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-black text-foreground">{locale === 'en' ? 'Eshop Marketplace' : 'کنترل‌های Marketplace Eshop'}</h1><p className="mt-1 text-sm text-muted-foreground">{locale === 'en' ? 'Manage banners and recommendation weights without code changes.' : 'بنرها و وزن‌های پیشنهاد را بدون تغییر کد مدیریت کنید.'}</p></header>
      <MarketplaceControls locale={locale} />
    </div>
  );
}
