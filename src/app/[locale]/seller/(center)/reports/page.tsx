import { BarChart3, DollarSign, Package, ShoppingBag, XCircle, Truck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/features/admin/components/stat-card';
import { EmptyState } from '@/features/admin/components/empty-state';
import { formatMoney } from '@/features/admin/lib/format';
import { requireSeller } from '@/lib/auth/roles';
import { getSellerReport } from '@/features/seller/lib/reports';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function SellerReportsPage({ params }: Props) {
  const { locale } = await params;
  const user = await requireSeller({ locale });
  const report = await getSellerReport(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-navy-800">گزارش فروش</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          خلاصه‌ای از عملکرد فروشگاه شما بر اساس داده‌های واقعی سفارش‌ها
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="مجموع سفارش‌ها"
          value={report.totals.orders.toLocaleString()}
          icon={<ShoppingBag className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="تعداد اقلام فروخته شده"
          value={report.totals.unitsSold.toLocaleString()}
          icon={<Package className="h-5 w-5" />}
          tone="default"
        />
        <StatCard
          label="درآمد تقریبی"
          value={formatMoney(report.totals.revenue, report.currency)}
          icon={<DollarSign className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="سفارش‌های لغو‌شده"
          value={report.totals.cancelledOrders.toLocaleString()}
          icon={<XCircle className="h-5 w-5" />}
          tone="warning"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="در انتظار"
          value={report.totals.pendingOrders.toLocaleString()}
          icon={<ShoppingBag className="h-5 w-5" />}
          tone="default"
        />
        <StatCard
          label="در حال آماده‌سازی"
          value={report.totals.processingOrders.toLocaleString()}
          icon={<Package className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="ارسال شده"
          value={report.totals.shippedOrders.toLocaleString()}
          icon={<Truck className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="تحویل شده"
          value={report.totals.deliveredOrders.toLocaleString()}
          icon={<BarChart3 className="h-5 w-5" />}
          tone="success"
        />
      </section>

      <Card className="p-5">
        <h3 className="mb-3 font-display text-lg font-semibold text-navy-800">
          محصولات پرفروش
        </h3>
        {report.topProducts.length === 0 ? (
          <EmptyState
            title="هنوز فروشی ثبت نشده"
            description="پس از فروش نخستین محصول، پرفروش‌ترین‌ها اینجا نمایش داده می‌شوند."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-start text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">محصول</th>
                  <th className="px-4 py-3 font-medium">تعداد فروش</th>
                  <th className="px-4 py-3 font-medium">درآمد</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((p) => (
                  <tr key={p.productId} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{p.name}</div>
                        <div className="truncate font-mono text-xs text-muted-foreground">
                          {p.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.unitsSold.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-3 font-semibold text-navy-800">
                      {formatMoney(p.revenue, report.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
