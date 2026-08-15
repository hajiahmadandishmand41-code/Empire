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

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const result = await listAdminUsers({ q: sp.q, page, pageSize: 10 });

  const columns: Column<AdminUserRow>[] = [
    {
      key: 'name',
      header: 'کاربر',
      cell: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{r.fullName}</div>
          <div className="truncate text-xs text-muted-foreground">{r.email ?? r.phone ?? '—'}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'تماس',
      cell: (r) => <div className="text-xs text-muted-foreground">{r.phone ?? '—'}</div>,
    },
    { key: 'orders', header: 'سفارش‌ها', cell: (r) => r.orderCount },
    { key: 'created', header: 'ثبت‌نام', cell: (r) => formatDate(r.createdAt) },
    {
      key: 'actions',
      header: 'عملیات',
      cell: (r) => <UserActions userId={r.id} role={r.role} isActive={r.isActive} />,
    },
  ];

  return (
    <div className="space-y-4">
      <header>
        <h2 className="font-display text-2xl font-bold text-navy-800">کاربران</h2>
        <p className="mt-1 text-sm text-muted-foreground">مدیریت نقش و وضعیت حساب کاربران</p>
      </header>

      <Card className="space-y-4 p-4">
        <SearchForm placeholder="جستجو با نام، ایمیل یا تلفن…" />

        {result.total === 0 ? (
          <EmptyState title="کاربری یافت نشد" description="با تغییر جستجو تلاش کنید." />
        ) : (
          <DataTable columns={columns} rows={result.items} rowKey={(r) => r.id} />
        )}

        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} />
      </Card>
    </div>
  );
}
