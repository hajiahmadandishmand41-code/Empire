import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/features/admin/components/data-table';
import { SearchForm } from '@/features/admin/components/search-form';
import { StatusFilter } from '@/features/admin/components/status-filter';
import { StatusBadge } from '@/features/admin/components/status-badge';
import { Pagination } from '@/features/admin/components/pagination';
import { EmptyState } from '@/features/admin/components/empty-state';
import { listAdminOrders } from '@/features/admin/lib/queries';
import type { AdminOrderRow } from '@/features/admin/lib/mock-data';
import { formatDateTime, formatMoney } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';
interface Props { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; status?: string; page?: string }> }

export default async function AdminOrdersPage({ params, searchParams }: Props) {
  const { locale } = await params; const sp = await searchParams; const t = await getTranslations('admin.ordersPage');
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const result = await listAdminOrders({ q: sp.q, status: sp.status, page, pageSize: 10 });
  const columns: Column<AdminOrderRow>[] = [
    { key: 'ref', header: t('number'), cell: (r) => <Link href={`/${locale}/admin/orders/${r.id}`} className="font-mono text-sm font-medium text-primary hover:underline">{r.reference}</Link> },
    { key: 'customer', header: t('customer'), cell: (r) => r.customerName },
    { key: 'status', header: t('status'), cell: (r) => <StatusBadge status={r.status} /> },
    { key: 'payment', header: t('payment'), cell: (r) => r.paymentMethod },
    { key: 'items', header: t('items'), cell: (r) => r.itemCount },
    { key: 'total', header: t('total'), cell: (r) => <span className="font-semibold text-navy-800">{formatMoney(r.total, r.currency)}</span> },
    { key: 'date', header: t('date'), cell: (r) => formatDateTime(r.createdAt) },
  ];
  return <div className="space-y-4"><header><h2 className="font-display text-2xl font-bold text-navy-800">{t('title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p></header><Card className="space-y-4 p-4"><div className="flex flex-col gap-3"><SearchForm placeholder={t('search')} /><StatusFilter /></div>{result.total === 0 ? <EmptyState title={t('empty')} description={t('emptyHint')} /> : <DataTable columns={columns} rows={result.items} rowKey={(r) => r.id} />}<Pagination page={result.page} pageSize={result.pageSize} total={result.total} /></Card></div>;
}
