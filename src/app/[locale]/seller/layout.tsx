import type { ReactNode } from 'react';
import { requireSeller } from '@/lib/auth/roles';
import { SellerShell } from '@/features/seller/components/seller-shell';

export const dynamic = 'force-dynamic';

export default async function SellerLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await requireSeller({ locale });
  return <SellerShell locale={locale} userName={user.fullName} storeName={user.sellerShopName}>{children}</SellerShell>;
}
