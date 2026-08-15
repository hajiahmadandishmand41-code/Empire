import Link from 'next/link';
import { Package, ShoppingBag, CheckCircle2, XCircle, DollarSign, Clock, BarChart3, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { StatCard } from '@/features/admin/components/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSellerStats } from '@/features/seller/lib/queries';
import { getSellerReport } from '@/features/seller/lib/reports';
import { getCurrentUser } from '@/lib/auth/current-user';
import { formatMoney } from '@/features/admin/lib/format';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { SellerSalesChart } from '@/features/seller/components/seller-sales-chart';

export const dynamic = 'force-dynamic';
interface Props { params: Promise<{ locale: string }>; }

async function getRecentOrders(sellerId: string) {
  if (!isDatabaseConfigured()) return [];
  try {
    const items = await prisma.orderItem.findMany({
      where: { product: { sellerId } },
      select: { id: true, quantity: true, price: true, name: true, order: { select: { id: true, reference: true, status: true, createdAt: true, currency: true } } },
      orderBy: { order: { createdAt: 'desc' } },
      take: 5,
      distinct: ['orderId'],
    });
    const seen = new Set<string>();
    return items.filter((i) => { if (seen.has(i.order.id)) return false; seen.add(i.order.id); return true; });
  } catch { return []; }
}

async function getLowStockProducts(sellerId: string) {
  if (!isDatabaseConfigured()) return [];
  try {
    return prisma.product.findMany({ where: { sellerId, isActive: true, stockQuantity: { lte: 5 } }, select: { id: true, name: true, slug: true, stockQuantity: true }, orderBy: { stockQuantity: 'asc' }, take: 5 });
  } catch { return []; }
}

async function getMonthlySalesData(sellerId: string) {
  if (!isDatabaseConfigured()) return [];
  try {
    const items = await prisma.orderItem.findMany({ where: { product: { sellerId }, order: { status: { not: 'cancelled' } } }, select: { price: true, quantity: true, order: { select: { createdAt: true } } } });
    const now = new Date();
    const months: Record<string, { label: string; revenue: number; orders: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fa-IR', { month: 'short', year: '2-digit' });
      months[key] = { label, revenue: 0, orders: 0 };
    }
    for (const item of items) {
      const d = item.order.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key]) {
        months[key].revenue += item.price.toNumber() * item.quantity;
        months[key].orders += 1;
      }
    }
    return Object.values(months);
  } catch { return []; }
}

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'در انتظار', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  confirmed: { label: 'تأیید شده', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  processing: { label: 'آماده‌سازی', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  shipped: { label: 'ارسال شده', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  delivered: { label: 'تحویل شده', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  cancelled: { label: 'لغو شده', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
};

export default async function SellerDashboardPage({ params }: Props) {
  const { locale } = await params;
  const user = await getCurrentUser();
  const sellerId = user && user.role === 'seller' ? user.id : undefined;
  const [stats, report, recentOrders, lowStock, monthlyData] = await Promise.all([
    getSellerStats(sellerId),
    sellerId ? getSellerReport(sellerId) : Promise.resolve(null),
    sellerId ? getRecentOrders(sellerId) : Promise.resolve([]),
    sellerId ? getLowStockProducts(sellerId) : Promise.resolve([]),
    sellerId ? getMonthlySalesData(sellerId) : Promise.resolve([]),
  ]);
  const isMock = stats.source === 'mock';

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-display text-2xl font-bold text-navy-800 dark:text-white">نمای کلی فروشنده</h2><p className="mt-1 text-sm text-muted-foreground">خلاصه‌ای از وضعیت محصولات، سفارش‌ها و درآمد شما</p></div>{isMock && <span className="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">حالت نمایشی — داده‌های Mock</span>}</header>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="تعداد محصولات" value={stats.products.toLocaleString('fa-IR')} icon={<Package className="h-5 w-5" />} tone="default" />
        <StatCard label="تعداد سفارش‌ها" value={stats.orders.toLocaleString('fa-IR')} icon={<ShoppingBag className="h-5 w-5" />} tone="info" />
        <StatCard label="سفارش‌های در انتظار" value={stats.pendingOrders.toLocaleString('fa-IR')} icon={<Clock className="h-5 w-5" />} tone="warning" />
        <StatCard label="درآمد تقریبی" value={formatMoney(stats.revenue, stats.currency)} icon={<DollarSign className="h-5 w-5" />} tone="success" />
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="محصولات فعال" value={stats.activeProducts.toLocaleString('fa-IR')} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" />
        <StatCard label="محصولات ناموجود" value={stats.outOfStockProducts.toLocaleString('fa-IR')} icon={<XCircle className="h-5 w-5" />} tone="warning" />
      </section>
      {monthlyData.length > 0 && <Card className="p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-navy-800 dark:text-white flex items-center gap-2"><TrendingUp className="h-5 w-5 text-rose-500" />روند درآمد (۶ ماه اخیر)</h3></div><SellerSalesChart data={monthlyData} /></Card>}
      {report && report.totals.orders > 0 && <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1"><h3 className="mb-4 font-display text-base font-semibold text-navy-800 dark:text-white">عملکرد فروش</h3><ul className="space-y-3 text-sm">{[
          { label: 'کل اقلام فروخته شده', value: report.totals.unitsSold.toLocaleString('fa-IR') + ' عدد' },
          { label: 'درآمد کل', value: formatMoney(report.totals.revenue, report.currency) },
          { label: 'سفارش تحویل شده', value: report.totals.deliveredOrders.toLocaleString('fa-IR') },
          { label: 'سفارش ارسال شده', value: report.totals.shippedOrders.toLocaleString('fa-IR') },
          { label: 'سفارش لغو شده', value: report.totals.cancelledOrders.toLocaleString('fa-IR') },
        ].map((row) => <li key={row.label} className="flex items-center justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">{row.label}</span><span className="font-semibold text-foreground">{row.value}</span></li>)}</ul><Link href={`/${locale}/seller/reports`} className="mt-4 block"><Button variant="outline" size="sm" className="w-full"><BarChart3 className="h-4 w-4" />گزارش کامل</Button></Link></Card>
        {report.topProducts.length > 0 && <Card className="p-5 lg:col-span-2"><h3 className="mb-3 font-display text-base font-semibold text-navy-800 dark:text-white">محصولات پرفروش</h3><ul className="divide-y divide-border">{report.topProducts.map((p, i) => <li key={p.productId} className="flex items-center gap-3 py-2.5 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span><div className="min-w-0 flex-1"><div className="truncate font-medium text-foreground">{p.name}</div><div className="text-xs text-muted-foreground">{p.unitsSold.toLocaleString('fa-IR')} فروش</div></div><span className="font-semibold text-navy-800 dark:text-white">{formatMoney(p.revenue, report.currency)}</span></li>)}</ul></Card>}
      </div>}
      {recentOrders.length > 0 && <Card className="p-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-display text-base font-semibold text-navy-800 dark:text-white">آخرین سفارش‌ها</h3><Link href={`/${locale}/seller/orders`}><Button variant="outline" size="sm"><ArrowRight className="h-4 w-4 rtl:rotate-180" />همه سفارش‌ها</Button></Link></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-2.5 text-start font-medium">شماره سفارش</th><th className="px-4 py-2.5 text-start font-medium">محصول</th><th className="px-4 py-2.5 text-start font-medium">مبلغ</th><th className="px-4 py-2.5 text-start font-medium">وضعیت</th><th className="px-4 py-2.5 text-start font-medium">تاریخ</th></tr></thead><tbody className="divide-y divide-border">{recentOrders.map((item) => { const badge = ORDER_STATUS[item.order.status] ?? { label: item.order.status, cls: 'bg-muted text-foreground' }; return <tr key={item.order.id} className="hover:bg-muted/30 transition-colors"><td className="px-4 py-2.5 font-mono text-xs text-muted-foreground"><Link href={`/${locale}/seller/orders/${item.order.id}`} className="hover:text-rose-600 hover:underline">#{item.order.reference}</Link></td><td className="px-4 py-2.5 max-w-[160px] truncate">{item.name}</td><td className="px-4 py-2.5 font-semibold">{formatMoney(item.price.toNumber() * item.quantity, item.order.currency)}</td><td className="px-4 py-2.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>{badge.label}</span></td><td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(item.order.createdAt).toLocaleDateString('fa-IR')}</td></tr>; })}</tbody></table></div></Card>}
      {lowStock.length > 0 && <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 p-5"><div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /><h3 className="font-display text-base font-semibold text-amber-800 dark:text-amber-300">هشدار: موجودی کم</h3></div><ul className="divide-y divide-amber-200/60 dark:divide-amber-800/40">{lowStock.map((p) => <li key={p.id} className="flex items-center justify-between py-2 text-sm"><span className="text-amber-900 dark:text-amber-300 font-medium">{p.name}</span><div className="flex items-center gap-3"><span className={`font-bold ${p.stockQuantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>{p.stockQuantity === 0 ? 'ناموجود' : `${p.stockQuantity} عدد`}</span><Link href={`/${locale}/seller/products/${p.id}/edit`}><Button variant="outline" size="sm" className="h-7 border-amber-300 text-xs text-amber-700 hover:bg-amber-100">ویرایش</Button></Link></div></li>)}</ul></Card>}
    </div>
  );
}
