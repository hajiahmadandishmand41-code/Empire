import Link from 'next/link';
import { AlertTriangle, ArrowLeft, BarChart3, CheckCircle2, Clock3, DollarSign, Package, ShoppingBag, Store } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/features/admin/components/stat-card';
import { BarChart } from '@/features/admin/components/bar-chart';
import { StatusBadge } from '@/features/admin/components/status-badge';
import { getAdminDashboardMetrics } from '@/features/admin/lib/dashboard';
import { formatDateTime, formatMoney } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';
interface Props { params: Promise<{ locale: string }> }

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  const d = await getAdminDashboardMetrics();
  const pendingOrders = d.recentOrders.filter((order) => ['pending', 'confirmed', 'processing'].includes(order.status)).length;
  const actions = d.lowStockCount + d.pendingSellers + pendingOrders + d.inactiveProducts;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-8">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">مرکز مدیریت</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />داده به‌روز</span>
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight sm:text-3xl">مدیریت Empire</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">مهم‌ترین وضعیت‌های فروشگاه را از یک صفحه ببینید و مستقیماً به عملیات موردنیاز بروید.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${locale}/admin/orders`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">سفارش‌ها <ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link>
            <Link href={`/${locale}/admin/products`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold">محصولات</Link>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="شاخص‌های اصلی">
        <StatCard label="فروش امروز" value={formatMoney(d.today, d.currency)} icon={<DollarSign className="h-5 w-5" />} tone="success" />
        <StatCard label="فروش این هفته" value={formatMoney(d.week, d.currency)} icon={<BarChart3 className="h-5 w-5" />} tone="info" />
        <StatCard label="فروش این ماه" value={formatMoney(d.month, d.currency)} icon={<DollarSign className="h-5 w-5" />} tone="default" />
        <StatCard label="میانگین هر سفارش" value={formatMoney(d.avgOrderValue, d.currency)} icon={<ShoppingBag className="h-5 w-5" />} tone="warning" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-base font-black">موارد نیازمند رسیدگی</h2><p className="mt-1 text-xs text-muted-foreground">بدون جست‌وجو، مستقیم وارد عملیات شوید.</p></div><span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">{actions.toLocaleString(locale)} مورد</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ActionCard href={`/${locale}/admin/orders?status=pending`} icon={<Clock3 className="h-5 w-5" />} value={pendingOrders} title="سفارش‌های در انتظار" note="بررسی سفارش‌های جدید" />
          <ActionCard href={`/${locale}/admin/products?stock=low`} icon={<AlertTriangle className="h-5 w-5" />} value={d.lowStockCount} title="موجودی کم" note="محصولات نزدیک به اتمام" />
          <ActionCard href={`/${locale}/admin/sellers?status=pending`} icon={<Store className="h-5 w-5" />} value={d.pendingSellers} title="درخواست فروشندگی" note="بررسی و تأیید فروشندگان" />
          <ActionCard href={`/${locale}/admin/products?status=inactive`} icon={<Package className="h-5 w-5" />} value={d.inactiveProducts} title="محصول غیرفعال" note="بازبینی وضعیت انتشار" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden p-0"><div className="border-b border-border px-5 py-4"><h2 className="text-base font-black">روند فروش ۳۰ روز اخیر</h2><p className="mt-1 text-xs text-muted-foreground">بر پایه سفارش‌های ثبت‌شده و غیرلغوشده</p></div><div className="p-5"><BarChart data={d.salesByDay.map((item) => ({ label: item.date, value: item.revenue }))} formatValue={(value) => formatMoney(value, d.currency)} ariaLabel="روند فروش سی روز اخیر" /></div></Card>
        <Card className="p-5"><div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><div><h2 className="text-base font-black">خلاصه فروشگاه</h2><p className="mt-1 text-xs text-muted-foreground">وضعیت فعلی</p></div></div><div className="space-y-3"><Metric label="سفارش‌ها" value={d.totalOrders.toLocaleString(locale)} /><Metric label="کاربران" value={d.users.toLocaleString(locale)} /><Metric label="فروشندگان" value={d.sellerCount.toLocaleString(locale)} /><Metric label="محصولات" value={d.products.toLocaleString(locale)} /><Metric label="درآمد کل" value={formatMoney(d.revenue, d.currency)} /></div></Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="overflow-hidden p-0"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-base font-black">آخرین سفارش‌ها</h2><p className="mt-1 text-xs text-muted-foreground">آخرین تراکنش‌های فروشگاه</p></div><Link href={`/${locale}/admin/orders`} className="text-xs font-bold text-primary">مشاهده همه</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="bg-muted/30"><tr><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">مرجع</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">مشتری</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">مبلغ</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">وضعیت</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">تاریخ</th></tr></thead><tbody className="divide-y divide-border">{d.recentOrders.map((order) => <tr key={order.id} className="hover:bg-muted/20"><td className="px-4 py-3 font-mono text-xs font-semibold">{order.reference}</td><td className="px-4 py-3">{order.address.fullName}</td><td className="px-4 py-3 font-bold">{formatMoney(order.total, order.currency)}</td><td className="px-4 py-3"><StatusBadge status={order.status} /></td><td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(order.createdAt.toISOString())}</td></tr>)}</tbody></table>{d.recentOrders.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">هنوز سفارشی ثبت نشده است.</div> : null}</div></Card>
        <Card className="p-5"><div className="mb-4 flex items-center gap-2"><Package className="h-5 w-5 text-amber-600" /><div><h2 className="text-base font-black">هشدار موجودی</h2><p className="mt-1 text-xs text-muted-foreground">کمبودهای مهم را همین‌جا ببینید.</p></div></div><div className="space-y-2">{d.lowStock.map((product) => <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"><span className="min-w-0 truncate text-sm font-semibold">{product.name}</span><span className="shrink-0 text-xs font-black">{product.stockQuantity === 0 ? 'ناموجود' : `${product.stockQuantity} عدد`}</span></div>)}{d.lowStock.length === 0 ? <div className="rounded-xl bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">موجودی بحرانی ندارید.</div> : null}</div><Link href={`/${locale}/admin/products?stock=low`} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">مدیریت موجودی <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /></Link></Card>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between border-b border-border/70 pb-2.5 last:border-0 last:pb-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-black">{value}</span></div>; }
function ActionCard({ href, icon, value, title, note }: { href: string; icon: React.ReactNode; value: number; title: string; note: string }) { return <Link href={href} className="group rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span><ArrowLeft className="h-4 w-4 text-muted-foreground rtl:rotate-180" /></div><div className="mt-4 text-2xl font-black">{value.toLocaleString('fa-AF')}</div><div className="mt-1 text-sm font-bold">{title}</div><div className="mt-1 text-xs text-muted-foreground">{note}</div></Link>; }
