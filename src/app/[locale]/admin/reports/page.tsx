import { DollarSign, TrendingUp, RefreshCcw, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/features/admin/components/stat-card';
import { BarChart } from '@/features/admin/components/bar-chart';
import { getAdminRevenue } from '@/features/admin/lib/queries';
import { formatMoney } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ days?: string }>;
}

const METHOD_LABEL: Record<string, string> = {
  cod: 'پرداخت درب منزل',
  bank_transfer: 'انتقال بانکی',
  whatsapp: 'واتس‌اپ',
  atoma_pay: 'Atoma Pay',
};

export default async function AdminRevenueReportPage({ searchParams }: Props) {
  const sp = await searchParams;
  const days = Math.min(180, Math.max(7, parseInt(sp.days ?? '30', 10) || 30));
  const data = await getAdminRevenue(days);
  const isMock = data.source === 'mock';

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-800">گزارش درآمد</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            نمای مالی {days} روز اخیر · {formatMoney(data.gross, data.currency)} فروش ناخالص
          </p>
        </div>
        {isMock && (
          <span className="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700">
            حالت نمایشی — داده‌های Mock
          </span>
        )}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="درآمد کل"
          value={formatMoney(data.gross, data.currency)}
          icon={<DollarSign className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="پرداخت شده"
          value={formatMoney(data.paid, data.currency)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="در انتظار پرداخت"
          value={formatMoney(data.pending, data.currency)}
          icon={<Clock className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="بازگشت داده شده"
          value={formatMoney(data.refunded, data.currency)}
          icon={<RefreshCcw className="h-5 w-5" />}
          tone="default"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                فروش روزانه ({days} روز اخیر)
              </h3>
              <p className="text-xs text-muted-foreground">
                {data.orderCount.toLocaleString()} سفارش کل ·{' '}
                {data.paidOrderCount.toLocaleString()} پرداخت‌شده · میانگین{' '}
                {formatMoney(data.averageOrderValue, data.currency)}
              </p>
            </div>
          </div>
          <BarChart
            data={data.byDay.map((d) => ({ label: d.date, value: d.revenue }))}
            formatValue={(v) => formatMoney(v, data.currency)}
            ariaLabel="Revenue by day"
          />
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold text-foreground">
            درآمد بر اساس روش پرداخت
          </h3>
          {data.byMethod.length === 0 ? (
            <p className="text-sm text-muted-foreground">داده‌ای موجود نیست.</p>
          ) : (
            <ul className="space-y-3">
              {data.byMethod.map((m) => {
                const pct = data.paid > 0 ? Math.round((m.amount / data.paid) * 100) : 0;
                return (
                  <li key={m.method} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">
                        {METHOD_LABEL[m.method] ?? m.method}
                      </span>
                      <span className="font-semibold text-navy-800">
                        {formatMoney(m.amount, data.currency)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{m.count.toLocaleString()} تراکنش</span>
                      <span>{pct}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
