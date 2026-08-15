import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/features/admin/components/data-table';
import { Pagination } from '@/features/admin/components/pagination';
import { EmptyState } from '@/features/admin/components/empty-state';
import { SearchForm } from '@/features/admin/components/search-form';
import { listAdminTransactions } from '@/features/admin/lib/queries';
import type { AdminTransactionRow } from '@/features/admin/lib/mock-data';
import { formatDateTime, formatMoney } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string; status?: string; method?: string }>;
}

const STATUS_TABS = [
  { key: '', label: 'همه' },
  { key: 'paid', label: 'پرداخت شده' },
  { key: 'pending', label: 'در انتظار' },
  { key: 'failed', label: 'ناموفق' },
  { key: 'refunded', label: 'بازگشت داده شده' },
];

const STATUS_TONE: Record<string, string> = {
  paid: 'bg-emerald-500/15 text-emerald-700',
  pending: 'bg-amber-500/15 text-amber-700',
  failed: 'bg-red-500/15 text-red-700',
  refunded: 'bg-sky-500/15 text-sky-700',
  cancelled: 'bg-muted text-muted-foreground',
};

const METHOD_LABEL: Record<string, string> = {
  cod: 'پرداخت درب منزل',
  bank_transfer: 'انتقال بانکی',
  whatsapp: 'واتس‌اپ',
  atoma_pay: 'Atoma Pay',
};

export default async function AdminPaymentsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const status = sp.status ?? '';
  const result = await listAdminTransactions({
    q: sp.q,
    status: status || undefined,
    method: sp.method || undefined,
    page,
    pageSize: 15,
  });

  const columns: Column<AdminTransactionRow>[] = [
    {
      key: 'ref',
      header: 'شناسه تراکنش',
      cell: (t) => (
        <div className="min-w-0">
          <div className="font-mono text-sm font-medium text-foreground">{t.reference}</div>
          <div className="text-xs text-muted-foreground">{t.provider}</div>
        </div>
      ),
    },
    {
      key: 'order',
      header: 'سفارش',
      cell: (t) => (
        <Link
          href={`/${locale}/admin/orders/${t.orderId}`}
          className="font-mono text-sm text-primary hover:underline"
        >
          {t.orderReference}
        </Link>
      ),
    },
    {
      key: 'method',
      header: 'روش',
      cell: (t) => (
        <span className="text-xs text-muted-foreground">
          {METHOD_LABEL[t.method] ?? t.method}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'مبلغ',
      cell: (t) => (
        <span className="font-semibold text-navy-800">{formatMoney(t.amount, t.currency)}</span>
      ),
    },
    {
      key: 'status',
      header: 'وضعیت',
      cell: (t) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            STATUS_TONE[t.status] ?? 'bg-muted text-muted-foreground'
          }`}
        >
          {t.status}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'تاریخ',
      cell: (t) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(t.paidAt ?? t.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <header>
        <h2 className="font-display text-2xl font-bold text-navy-800">پرداخت‌ها و تراکنش‌ها</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          مشاهده تراکنش‌های همه روش‌های پرداخت
        </p>
      </header>

      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
            {STATUS_TABS.map((t) => {
              const params = new URLSearchParams();
              if (t.key) params.set('status', t.key);
              if (sp.method) params.set('method', sp.method);
              const href =
                `/${locale}/admin/payments` +
                (params.toString() ? `?${params.toString()}` : '');
              const active = (status ?? '') === t.key;
              return (
                <Link
                  key={t.key || 'all'}
                  href={href}
                  className={
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors ' +
                    (active
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground')
                  }
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
          <div className="min-w-[240px] flex-1">
            <SearchForm placeholder="جستجو با شناسه تراکنش یا سفارش…" />
          </div>
        </div>

        {result.total === 0 ? (
          <EmptyState title="تراکنشی یافت نشد" description="فیلتر یا جستجو را تغییر دهید." />
        ) : (
          <DataTable columns={columns} rows={result.items} rowKey={(r) => r.id} />
        )}

        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} />
      </Card>
    </div>
  );
}
