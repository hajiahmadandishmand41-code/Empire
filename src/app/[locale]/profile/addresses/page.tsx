import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { AddressManager } from '@/features/profile/components/address-manager';

export const dynamic = 'force-dynamic';

export default async function ProfileAddressesPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/login?redirect=/profile/addresses`);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-bold text-navy-800">مدیریت آدرس‌ها</h1>
      <AddressManager />
    </main>
  );
}
