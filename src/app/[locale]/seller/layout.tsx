import type { ReactNode } from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { requireSeller } from '@/lib/auth/roles';
import { SellerShell } from '@/features/seller/components/seller-shell';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

export default async function SellerLayout({ params, children }: Props) {
  const { locale } = await params;
  const user = await requireSeller({ locale });
  return (
    <>
      <SellerShell locale={locale} userName={user.fullName}>
        {children}
      </SellerShell>
      <SonnerToaster position="top-center" richColors />
    </>
  );
}
