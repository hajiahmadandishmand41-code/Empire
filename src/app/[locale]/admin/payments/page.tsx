import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/features/admin/components/data-table';
import { Pagination } from '@/features/admin/components/pagination';
import { EmptyState } from '@/features/admin/components/empty-state';
import { SearchForm } from '@/features/admin/components/search-form';
import { listAdminTransactions } from '@/features/admin/lib/queries';
import type { AdminTransactionRow } from '@/features/admin/lib/mock-data';
import { formatDateTime, formatMoney } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';
interface Props { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; page?: string; status?: string; method?: string }> }
const STATUS_TONE: Record<string, string> = { paid: 'bg-emerald-500/15 text-emerald-700', pending: 'bg-amber-500/15 text-amber-700', failed: 'bg-red-500/15 text-red-700', refunded: 'bg-sky-500/15 text-sky-700', cancelled: 'bg-muted text-muted-foreground' };

export default async function AdminPaymentsPage({ params, searchParams }: Props) {
  const { locale } = await params; const sp = await searchParams; const t = await getTranslations('admin.paymentsPage');
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1); const status = sp.status ?? '';
  const result = await listAdminTransactions({ q: sp.q, status: status || undefined, method: sp.method || undefined, page, pageSize: 15 });
  const statuses = [['', t('all')], ['paid', t('paid')], ['pending', t('pending')], ['failed', t('failed')], ['refunded', t('refunded')]];
  const methodLabel = (method: string) => ({ cod: t('cash'), bank_transfer: t('bank'), whatsapp: t('whatsapp'), atoma_pay: t('atoma') })[method] ?? method;
  const columns: Column<AdminTransactionRow>[] = [
    { key: 'ref', header: t('transaction'), cell: (row) => <div><div className="font-mono text-sm font-medium">{row.reference}</div><div className="text-xs text-muted-foreground">{row.provider}</div></div> },
    { key: 'order', header: t('order'), cell: (row) => <Link href={`/${locale}/admin/orders/${row.orderId}`} className="font-mono text-sm text-primary hover:underline">{row.orderReference}</Link> },
    { key: 'method', header: t('method'), cell: (row) => <span className="text-xs text-muted-foreground">{methodLabel(row.method)}</span> },
    { key: 'amount', header: t('amount'), cell: (row) => <span className="font-semibold text-navy-800">{formatMoney(row.amount, row.currency)}</span> },
    { key: 'status', header: t('status'), cell: (row) => <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[row.status] ?? 'bg-muted text-muted-foreground'}`}>{t.has(row.status) ? t(row.status) : row.status}</span> },
    { key: 'date', header: t('date'), cell: (row) => <span className="text-xs text-muted-foreground">{formatDateTime(row.paidAt ?? row.createdAt)}</span> },
  ];
  return <div className="space-y-4"><header><h2 className="font-display text-2xl font-bold text-navy-800">{t('title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p></header><Card className="space-y-4 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">{statuses.map(([key, label]) => { const params = new URLSearchParams(); if (key) params.set('status', key); if (sp.method) params.set('method', sp.method); const href = `/${locale}/admin/payments` + (params.toString() ? `?${params.toString()}` : ''); return <Link key={key || 'all'} href={href} className={'rounded-md px-3 py-1 text-xs font-medium transition-colors ' + ((status || '') === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{label}</Link>; })}</div><div className="min-w-[240px] flex-1"><SearchForm placeholder={t('search')} /></div></div>{result.total === 0 ? <EmptyState title={t('empty')} description={t('emptyHint')} /> : <DataTable columns={columns} rows={result.items} rowKey={(row) => row.id} />}<Pagination page={result.page} pageSize={result.pageSize} total={result.total} /></Card></div>;
}
