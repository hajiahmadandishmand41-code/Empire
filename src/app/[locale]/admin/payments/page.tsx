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
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1); const status = sp.status ?? ''; const method = sp.method ?? '';
  const result = await listAdminTransactions({ q: sp.q, status: status || undefined, method: method || undefined, page, pageSize: 20 });
  const statuses = [['', t('all')], ['paid', t('paid')], ['pending', t('pending')], ['failed', t('failed')], ['refunded', t('refunded')]];
  const methods = [['', 'همه روش‌ها'], ['cod', t('cash')], ['bank_transfer', t('bank')], ['whatsapp', t('whatsapp')], ['atoma_pay', t('atoma')]];
  const methodLabel = (value: string) => ({ cod: t('cash'), bank_transfer: t('bank'), whatsapp: t('whatsapp'), atoma_pay: t('atoma') })[value] ?? value;
  const buildHref = (nextStatus = status, nextMethod = method) => { const params = new URLSearchParams(); if (nextStatus) params.set('status', nextStatus); if (nextMethod) params.set('method', nextMethod); return `/${locale}/admin/payments${params.toString() ? `?${params.toString()}` : ''}`; };
  const columns: Column<AdminTransactionRow>[] = [
    { key: 'ref', header: t('transaction'), cell: (row) => <div><div className="font-mono text-sm font-medium">{row.reference}</div><div className="text-xs text-muted-foreground">{row.provider}</div></div> },
    { key: 'order', header: t('order'), cell: (row) => <Link href={`/${locale}/admin/orders/${row.orderId}`} className="font-mono text-sm text-primary hover:underline">{row.orderReference}</Link> },
    { key: 'method', header: t('method'), cell: (row) => <span className="text-xs text-muted-foreground">{methodLabel(row.method)}</span> },
    { key: 'amount', header: t('amount'), cell: (row) => <span className="font-bold">{formatMoney(row.amount, row.currency)}</span> },
    { key: 'status', header: t('status'), cell: (row) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_TONE[row.status] ?? 'bg-muted text-muted-foreground'}`}>{t.has(row.status) ? t(row.status) : row.status}</span> },
    { key: 'date', header: t('date'), cell: (row) => <span className="text-xs text-muted-foreground">{formatDateTime(row.paidAt ?? row.createdAt)}</span> },
  ];
  return <div className="space-y-5"><header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-display text-2xl font-black text-foreground">{t('title')}</h2><p className="mt-1 text-sm text-muted-foreground">مدیریت سریع هزاران تراکنش با فیلتر وضعیت، روش پرداخت و جستجوی شناسه</p></div><div className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">{result.total.toLocaleString(locale)} تراکنش</div></header><Card className="space-y-4 p-4"><div className="flex flex-col gap-3"><div className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">{statuses.map(([key, label]) => <Link key={key || 'all'} href={buildHref(key, method)} className={'rounded-lg px-3 py-2 text-xs font-bold transition-colors ' + ((status || '') === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{label}</Link>)}</div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-muted-foreground">روش پرداخت:</span>{methods.map(([key, label]) => <Link key={key || 'all-methods'} href={buildHref(status, key)} className={'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ' + ((method || '') === key ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:bg-muted')}>{label}</Link>)}<div className="min-w-[240px] flex-1"><SearchForm placeholder={t('search')} /></div></div></div>{result.total === 0 ? <EmptyState title={t('empty')} description={t('emptyHint')} /> : <DataTable columns={columns} rows={result.items} rowKey={(row) => row.id} />}<Pagination page={result.page} pageSize={result.pageSize} total={result.total} /></Card></div>;
}
