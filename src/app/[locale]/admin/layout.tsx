import type { ReactNode } from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { requireAdmin } from '@/lib/auth/roles';
import { AdminShell } from '@/features/admin/components/admin-shell';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

export default async function AdminLayout({ params, children }: Props) {
  const { locale } = await params;
  const user = await requireAdmin({ locale });
  return (
    <>
      <AdminShell locale={locale} userName={user.fullName}>
        {children}
      </AdminShell>
      <SonnerToaster position="top-center" richColors />
    </>
  );
}
