import { getTranslations } from 'next-intl/server';
import { Users, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/features/admin/components/data-table';
import { SearchForm } from '@/features/admin/components/search-form';
import { Pagination } from '@/features/admin/components/pagination';
import { EmptyState } from '@/features/admin/components/empty-state';
import { UserActions } from '@/features/admin/components/user-actions';
import { listAdminUsers } from '@/features/admin/lib/queries';
import type { AdminUserRow } from '@/features/admin/lib/mock-data';
import { formatDate } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';
interface Props { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; page?: string }> }

export default async function AdminUsersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations('admin.usersPage');
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const result = await listAdminUsers({ q: sp.q, page, pageSize: 10 });
  const activeCount = result.items.filter((u) => u.isActive).length;
  const sellerCount = result.items.filter((u) => u.role === 'seller').length;
  const adminCount = result.items.filter((u) => u.role === 'admin').length;

  const columns: Column<AdminUserRow>[] = [
    { key: 'name', header: t('user'), cell: (r) => <div className="min-w-0"><div className="truncate font-semibold text-foreground">{r.fullName}</div><div className="truncate text-xs text-muted-foreground">{r.email ?? r.phone ?? '—'}</div></div> },
    { key: 'role', header: 'نقش', cell: (r) => <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{r.role === 'admin' ? 'مدیر' : r.role === 'seller' ? 'فروشنده' : 'مشتری'}</span> },
    { key: 'contact', header: t('contact'), cell: (r) => <span className="text-xs text-muted-foreground">{r.phone ?? '—'}</span> },
    { key: 'orders', header: t('orders'), cell: (r) => <span className="font-semibold">{r.orderCount.toLocaleString('fa-IR')}</span> },
    { key: 'status', header: 'وضعیت', cell: (r) => <span className={r.isActive ? 'inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700' : 'inline-flex rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground'}>{r.isActive ? 'فعال' : 'غیرفعال'}</span> },
    { key: 'created', header: t('registered'), cell: (r) => formatDate(r.createdAt) },
    { key: 'actions', header: t('actions'), className: 'text-end', cell: (r) => <UserActions userId={r.id} role={r.role} isActive={r.isActive} /> },
  ];

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"><Users className="h-3.5 w-3.5" /> مرکز کاربران</div>
        <h2 className="font-display text-2xl font-black text-foreground">{t('title')}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">مدیریت حساب‌ها، نقش‌ها و وضعیت فعال‌بودن کاربران از یک نمای مدیریتی واحد.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="کل کاربران" value={result.total} icon={<Users className="h-4 w-4" />} />
        <SummaryCard title="فعال" value={activeCount} icon={<UserCheck className="h-4 w-4" />} />
        <SummaryCard title="فروشندگان" value={sellerCount} icon={<ShieldCheck className="h-4 w-4" />} />
        <SummaryCard title="مدیران" value={adminCount} icon={<UserX className="h-4 w-4" />} />
      </section>

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h3 className="text-base font-bold">فهرست کاربران</h3><p className="mt-1 text-xs text-muted-foreground">نقش و وضعیت حساب را مستقیماً از همین جدول مدیریت کنید.</p></div>
          <div className="w-full lg:max-w-sm"><SearchForm placeholder={t('search')} /></div>
        </div>
        {result.total === 0 ? <EmptyState title={t('empty')} description={t('emptyHint')} /> : <DataTable columns={columns} rows={result.items} rowKey={(r) => r.id} />}
        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} />
      </Card>
    </div>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return <Card className="p-4"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-muted-foreground">{title}</span><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span></div><div className="mt-3 text-2xl font-black text-foreground">{value.toLocaleString('fa-IR')}</div></Card>;
}
