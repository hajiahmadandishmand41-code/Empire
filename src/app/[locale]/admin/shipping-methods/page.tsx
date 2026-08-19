import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { ShippingMethodsManager } from '@/features/admin/components/shipping-methods-manager';

export const dynamic = 'force-dynamic';

export default async function AdminShippingMethodsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/login?redirect=/admin/shipping-methods`);
  if (user.role !== 'admin') redirect(`/${locale}/403`);
  const t = await getTranslations('admin.shippingPage');
  return <main className="container mx-auto max-w-6xl px-4 py-8"><h1 className="mb-6 font-display text-2xl font-bold text-navy-800">{t('title')}</h1><ShippingMethodsManager /></main>;
}
