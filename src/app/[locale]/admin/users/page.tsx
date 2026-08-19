import { getTranslations } from 'next-intl/server';
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
interface Props { searchParams: Promise<{ q?: string; page?: string }> }

export default async function AdminUsersPage({ searchParams }: Props) {
  const sp = await searchParams; const t = await getTranslations('admin.usersPage');
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const result = await listAdminUsers({ q: sp.q, page, pageSize: 10 });
  const columns: Column<AdminUserRow>[] = [
    { key: 'name', header: t('user'), cell: (r) => <div className="min-w-0"><div className="truncate font-medium text-foreground">{r.fullName}</div><div className="truncate text-xs text-muted-foreground">{r.email ?? r.phone ?? '—'}</div></div> },
    { key: 'contact', header: t('contact'), cell: (r) => <div className="text-xs text-muted-foreground">{r.phone ?? '—'}</div> },
    { key: 'orders', header: t('orders'), cell: (r) => r.orderCount },
    { key: 'created', header: t('registered'), cell: (r) => formatDate(r.createdAt) },
    { key: 'actions', header: t('actions'), cell: (r) => <UserActions userId={r.id} role={r.role} isActive={r.isActive} /> },
  ];
  return <div className="space-y-4"><header><h2 className="font-display text-2xl font-bold text-navy-800">{t('title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p></header><Card className="space-y-4 p-4"><SearchForm placeholder={t('search')} />{result.total === 0 ? <EmptyState title={t('empty')} description={t('emptyHint')} /> : <DataTable columns={columns} rows={result.items} rowKey={(r) => r.id} />}<Pagination page={result.page} pageSize={result.pageSize} total={result.total} /></Card></div>;
}
