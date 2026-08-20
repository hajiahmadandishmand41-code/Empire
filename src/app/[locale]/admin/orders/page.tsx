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
import { ShoppingBag, Clock3, CreditCard, Truck, ArrowUpLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
interface Props { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; status?: string; page?: string }> }

const fa = {
  title: 'مرکز سفارش‌ها',
  subtitle: 'جریان سفارش‌ها، پرداخت و ارسال را از یکجا مدیریت کنید.',
  search: 'جستجو با شماره سفارش یا نام مشتری…',
  number: 'شماره سفارش', customer: 'مشتری', status: 'وضعیت', payment: 'پرداخت', items: 'اقلام', total: 'مجموع', date: 'تاریخ',
  empty: 'سفارشی یافت نشد', emptyHint: 'عبارت جستجو یا فیلتر وضعیت را تغییر دهید.', all: 'همه',
  quick: 'دسترسی سریع', pending: 'در انتظار', processing: 'در حال آماده‌سازی', shipped: 'ارسال شده', delivered: 'تحویل شده',
};

type Labels = typeof fa;

export default async function AdminOrdersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations('admin.ordersPage');
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const result = await listAdminOrders({ q: sp.q, status: sp.status, page, pageSize: 10 });
  const labels: Labels = locale === 'fa' || locale === 'ps' || locale === 'en'
    ? fa
    : {
        ...fa,
        title: t('title'),
        subtitle: t('subtitle'),
        search: t('search'),
        number: t('number'),
        customer: t('customer'),
        status: t('status'),
        payment: t('payment'),
        items: t('items'),
        total: t('total'),
        date: t('date'),
        empty: t('empty'),
        emptyHint: t('emptyHint'),
        all: t('all'),
        quick: t('quick'),
        pending: t('pending'),
        processing: t('processing'),
        shipped: t('shipped'),
        delivered: t('delivered'),
      };
  const columns: Column<AdminOrderRow>[] = [
    { key: 'ref', header: labels.number, cell: (r) => <Link href={`/${locale}/admin/orders/${r.id}`} className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-primary hover:underline"><span>{r.reference}</span><ArrowUpLeft className="h-3.5 w-3.5" aria-hidden /></Link> },
    { key: 'customer', header: labels.customer, cell: (r) => <div className="min-w-0"><div className="truncate font-medium">{r.customerName}</div><div className="text-[11px] text-muted-foreground">{r.itemCount} قلم</div></div> },
    { key: 'status', header: labels.status, cell: (r) => <StatusBadge status={r.status} /> },
    { key: 'payment', header: labels.payment, cell: (r) => <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold"><CreditCard className="h-3.5 w-3.5" aria-hidden />{r.paymentMethod}</span> },
    { key: 'total', header: labels.total, cell: (r) => <span className="font-bold text-foreground">{formatMoney(r.total, r.currency)}</span> },
    { key: 'date', header: labels.date, cell: (r) => <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span> },
  ];
  return <div className="space-y-6">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary"><ShoppingBag className="h-3.5 w-3.5" aria-hidden />مرکز عملیات فروش</div><h1 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">{labels.title}</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{labels.subtitle}</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Link href={`/${locale}/admin/orders?status=pending`} className="rounded-2xl border border-border bg-card px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-sm"><Clock3 className="mb-2 h-4 w-4 text-amber-600" aria-hidden /><div className="text-xs font-bold">{labels.pending}</div><div className="text-[11px] text-muted-foreground">بررسی سریع</div></Link><Link href={`/${locale}/admin/orders?status=processing`} className="rounded-2xl border border-border bg-card px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-sm"><ShoppingBag className="mb-2 h-4 w-4 text-blue-600" aria-hidden /><div className="text-xs font-bold">{labels.processing}</div><div className="text-[11px] text-muted-foreground">در صف آماده‌سازی</div></Link><Link href={`/${locale}/admin/orders?status=shipped`} className="rounded-2xl border border-border bg-card px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-sm"><Truck className="mb-2 h-4 w-4 text-violet-600" aria-hidden /><div className="text-xs font-bold">{labels.shipped}</div><div className="text-[11px] text-muted-foreground">در مسیر مشتری</div></Link><Link href={`/${locale}/admin/orders?status=delivered`} className="rounded-2xl border border-border bg-card px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-sm"><CreditCard className="mb-2 h-4 w-4 text-emerald-600" aria-hidden /><div className="text-xs font-bold">{labels.delivered}</div><div className="text-[11px] text-muted-foreground">تحویل‌شده</div></Link></div></header>
    <Card className="overflow-hidden p-4 sm:p-5"><div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-sm font-black">فهرست سفارش‌ها</h2><p className="text-xs text-muted-foreground">برای مشاهده کامل هر سفارش روی شماره آن بزنید.</p></div><div className="flex flex-col gap-2 sm:flex-row"><SearchForm placeholder={labels.search} /><StatusFilter /></div></div>{result.total === 0 ? <EmptyState title={labels.empty} description={labels.emptyHint} /> : <DataTable columns={columns} rows={result.items} rowKey={(r) => r.id} />}<Pagination page={result.page} pageSize={result.pageSize} total={result.total} /></Card>
  </div>;
}
