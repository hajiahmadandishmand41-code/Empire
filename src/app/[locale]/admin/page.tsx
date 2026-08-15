import Link from 'next/link';
import { Users, Package, ShoppingBag, FolderTree, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/features/admin/components/stat-card';
import { BarChart } from '@/features/admin/components/bar-chart';
import { StatusBadge } from '@/features/admin/components/status-badge';
import {
  getAdminStats,
  listAdminOrders,
  getSalesByDay,
  getTopProducts,
  listAdminSellers,
} from '@/features/admin/lib/queries';
import { formatDateTime, formatMoney } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  const [stats, sales, top, latest, pendingSellers] = await Promise.all([
    getAdminStats(),
    getSalesByDay(14),
    getTopProducts(5),
    listAdminOrders({ page: 1, pageSize: 6 }),
    listAdminSellers({ status: 'pending', page: 1, pageSize: 5 }),
  ]);

  const isMock = stats.source === 'mock';

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-800">نمای کلی</h2>
          <p className="mt-1 text-sm text-muted-foreground">گزارش لحظه‌ای از وضعیت فروشگاه</p>
        </div>
        {isMock && (
          <span className="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700">
            حالت نمایشی — داده‌های Mock
          </span>
        )}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="کاربران"
          value={stats.users.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="محصولات"
          value={stats.products.toLocaleString()}
          icon={<Package className="h-5 w-5" />}
          tone="default"
        />
        <StatCard
          label="سفارش‌ها"
          value={stats.orders.toLocaleString()}
          icon={<ShoppingBag className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="دسته‌بندی‌ها"
          value={stats.categories.toLocaleString()}
          icon={<FolderTree className="h-5 w-5" />}
          tone="warning"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">فروش ۱۴ روز اخیر</h3>
              <p className="text-xs text-muted-foreground">
                مجموع درآمد: {formatMoney(stats.revenue, stats.currency)}
              </p>
            </div>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </div>
          <BarChart
            data={sales.items.map((s) => ({ label: s.date, value: s.revenue }))}
            formatValue={(v) => formatMoney(v)}
            ariaLabel="Sales by day"
          />
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold text-foreground">محصولات پرفروش</h3>
          {top.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">داده‌ای موجود نیست.</p>
          ) : (
            <ol className="space-y-3">
              {top.items.map((p, i) => (
                <li key={p.slug} className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.units} فروش</div>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-navy-800">
                    {formatMoney(p.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </section>

      <section>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">آخرین سفارش‌ها</h3>
            <Link
              href={`/${locale}/admin/orders`}
              className="text-xs font-medium text-primary hover:underline"
            >
              مشاهده همه ←
            </Link>
          </div>

          {latest.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">سفارشی موجود نیست.</p>
          ) : (
            <ul className="divide-y divide-border">
              {latest.items.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/${locale}/admin/orders/${o.id}`}
                      className="font-mono text-sm font-medium text-primary hover:underline"
                    >
                      {o.reference}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {o.customerName} · {formatDateTime(o.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <span className="text-sm font-semibold text-navy-800">
                      {formatMoney(o.total, o.currency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {pendingSellers.total > 0 && (
        <section>
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  درخواست‌های فروشندگی در انتظار
                </h3>
                <p className="text-xs text-muted-foreground">
                  {pendingSellers.total.toLocaleString()} درخواست منتظر بررسی است
                </p>
              </div>
              <Link
                href={`/${locale}/admin/sellers?status=pending`}
                className="text-xs font-medium text-primary hover:underline"
              >
                بررسی همه ←
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {pendingSellers.items.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {s.shopName ?? s.fullName}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {s.fullName} · {s.email ?? s.phone ?? '—'}
                    </div>
                  </div>
                  <Link
                    href={`/${locale}/admin/sellers?status=pending`}
                    className="inline-flex h-8 items-center rounded-md border border-primary/40 bg-primary/10 px-3 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    بررسی
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
