import { getAdminDashboardMetrics } from '@/features/admin/lib/dashboard';
import { formatMoney } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const d = await getAdminDashboardMetrics();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">مرکز تحلیل</h1>
        <p className="mt-1 text-sm text-muted-foreground">درآمد، سفارش‌ها، میانگین ارزش سفارش و عملکرد محصولات، دسته‌ها و فروشندگان بر اساس داده واقعی.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="درآمد کل" value={formatMoney(d.revenue, d.currency)} />
        <MetricCard label="میانگین ارزش سفارش" value={formatMoney(d.avgOrderValue, d.currency)} />
        <MetricCard label="تعداد سفارش‌ها" value={d.totalOrders.toLocaleString('fa-AF')} />
        <MetricCard label="موجودی کم" value={d.lowStockCount.toLocaleString('fa-AF')} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <MetricList title="محصولات پرفروش" items={d.topProducts} currency={d.currency} empty="داده‌ای وجود ندارد." />
        <MetricList title="دسته‌های پرفروش" items={d.topCategories} currency={d.currency} empty="داده‌ای وجود ندارد." />
        <MetricList title="فروشندگان برتر" items={d.topSellers} currency={d.currency} empty="داده‌ای وجود ندارد." />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-black">{value}</div></div>;
}

function MetricList({ title, items, currency, empty }: { title: string; items: Array<{ name: string; revenue: number }>; currency: string; empty: string }) {
  return <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">{title}</h2><div className="mt-4 space-y-3">{items.map((item) => <div key={item.name} className="flex justify-between gap-3 text-sm"><span className="truncate">{item.name}</span><b>{formatMoney(item.revenue, currency)}</b></div>)}{items.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : null}</div></section>;
}
