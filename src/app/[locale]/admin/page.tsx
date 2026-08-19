import Link from 'next/link';
import { Users, Package, ShoppingBag, FolderTree, DollarSign, Store, AlertTriangle, UserCog, Megaphone } from 'lucide-react';
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
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="font-display text-2xl font-black text-foreground">مرکز مدیریت Eshop</h1><p className="mt-1 text-sm text-muted-foreground">نمای زنده Marketplace بر اساس داده‌های واقعی Database</p></div>
        <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Live Database</div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="فروش امروز" value={formatMoney(d.today, d.currency)} icon={<DollarSign className="h-5 w-5" />} tone="success" />
        <StatCard label="فروش این هفته" value={formatMoney(d.week, d.currency)} icon={<DollarSign className="h-5 w-5" />} tone="info" />
        <StatCard label="فروش این ماه" value={formatMoney(d.month, d.currency)} icon={<DollarSign className="h-5 w-5" />} tone="default" />
        <StatCard label="درآمد کل" value={formatMoney(d.revenue, d.currency)} icon={<DollarSign className="h-5 w-5" />} tone="warning" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="سفارش‌های جدید" value={d.newOrders.toLocaleString(locale)} icon={<ShoppingBag className="h-5 w-5" />} tone="warning" />
        <StatCard label="کاربران" value={d.users.toLocaleString(locale)} icon={<Users className="h-5 w-5" />} tone="info" />
        <StatCard label="فروشندگان" value={d.sellers.toLocaleString(locale)} icon={<Store className="h-5 w-5" />} tone="default" />
        <StatCard label="محصولات" value={d.products.toLocaleString(locale)} icon={<Package className="h-5 w-5" />} tone="success" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="محصولات غیرفعال" value={d.inactiveProducts.toLocaleString(locale)} icon={<Package className="h-5 w-5" />} tone="warning" />
        <StatCard label="موجودی کم" value={d.lowStockCount.toLocaleString(locale)} icon={<AlertTriangle className="h-5 w-5" />} tone="warning" />
        <StatCard label="درخواست فروشنده" value={d.pendingSellers.toLocaleString(locale)} icon={<UserCog className="h-5 w-5" />} tone="info" />
        <StatCard label="میانگین سفارش" value={formatMoney(d.avgOrderValue, d.currency)} icon={<ShoppingBag className="h-5 w-5" />} tone="default" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold">فروش روزانه (۳۰ روز)</h2><p className="text-xs text-muted-foreground">درآمد و تعداد سفارش واقعی</p></div><DollarSign className="h-5 w-5 text-muted-foreground" /></div>
          <BarChart data={d.salesByDay.map((s) => ({ label: s.date, value: s.revenue }))} formatValue={(v) => formatMoney(v, d.currency)} ariaLabel="فروش روزانه" />
        </Card>
        <Card className="p-5"><h2 className="mb-4 text-base font-semibold">پرفروش‌ترین محصولات</h2><ol className="space-y-3">{d.topProducts.map((p, i) => <li key={`${p.name}-${i}`} className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span><span className="truncate text-sm font-medium">{p.name}</span></div><span className="text-sm font-semibold">{formatMoney(p.revenue, d.currency)}</span></li>)}{d.topProducts.length === 0 && <li className="text-sm text-muted-foreground">داده‌ای موجود نیست.</li>}</ol></Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">دسته‌های برتر</h2><Link href={`/${locale}/admin/categories`} className="text-xs text-primary hover:underline">مدیریت دسته‌ها</Link></div><div className="space-y-3">{d.topCategories.map((c) => <div key={c.name} className="flex items-center justify-between border-b border-border/60 pb-2 text-sm"><span>{c.name}</span><span className="font-semibold">{formatMoney(c.revenue, d.currency)}</span></div>)}</div></Card>
        <Card className="p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">فروشندگان برتر</h2><Link href={`/${locale}/admin/sellers`} className="text-xs text-primary hover:underline">مدیریت فروشندگان</Link></div><div className="space-y-3">{d.topSellers.map((s) => <div key={s.name} className="flex items-center justify-between border-b border-border/60 pb-2 text-sm"><span className="truncate">{s.name}</span><span className="font-semibold">{formatMoney(s.revenue, d.currency)}</span></div>)}</div></Card>
      </section>

      <Card className="p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">آخرین سفارش‌ها</h2><Link href={`/${locale}/admin/orders`} className="text-xs text-primary hover:underline">همه سفارش‌ها</Link></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="px-3 py-2 text-start">مرجع</th><th className="px-3 py-2 text-start">مشتری</th><th className="px-3 py-2 text-start">مبلغ</th><th className="px-3 py-2 text-start">وضعیت</th><th className="px-3 py-2 text-start">تاریخ</th></tr></thead><tbody className="divide-y divide-border">{d.recentOrders.map((o) => <tr key={o.id}><td className="px-3 py-2 font-mono text-xs">{o.reference}</td><td className="px-3 py-2">{o.address.fullName}</td><td className="px-3 py-2 font-semibold">{formatMoney(o.total, o.currency)}</td><td className="px-3 py-2"><StatusBadge status={o.status} /></td><td className="px-3 py-2 text-xs text-muted-foreground">{formatDateTime(o.createdAt.toISOString())}</td></tr>)}</tbody></table></div></Card>

      {(d.lowStock.length > 0 || d.pendingSellers > 0) && <section className="grid gap-4 lg:grid-cols-2"><Card className="border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900 dark:bg-amber-950/20"><div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /><h2 className="font-semibold">هشدار موجودی</h2></div>{d.lowStock.map((p) => <div key={p.id} className="flex items-center justify-between border-b border-amber-200/70 py-2 text-sm"><span className="truncate">{p.name}</span><span className="font-bold">{p.stockQuantity === 0 ? 'ناموجود' : `${p.stockQuantity} عدد`}</span></div>)}<Link href={`/${locale}/admin/products`} className="mt-3 inline-block text-xs font-semibold text-primary">مدیریت محصولات</Link></Card><Card className="p-5"><div className="mb-3 flex items-center gap-2"><Store className="h-5 w-5 text-primary" /><h2 className="font-semibold">درخواست‌های فروشنده</h2></div>{d.sellers.filter((s) => s.sellerStatus === 'pending').map((s) => <div key={s.id} className="flex items-center justify-between border-b border-border py-2 text-sm"><span className="truncate">{s.sellerShopName ?? s.fullName}</span><span className="text-xs text-muted-foreground">در انتظار بررسی</span></div>)}<Link href={`/${locale}/admin/sellers?status=pending`} className="mt-3 inline-block text-xs font-semibold text-primary">بررسی درخواست‌ها</Link></Card></section>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Link href={`/${locale}/admin/banners`} className="rounded-2xl border border-border bg-card p-4 hover:bg-muted/40"><Megaphone className="mb-2 h-5 w-5 text-primary" /><div className="font-semibold">مدیریت Banner</div><div className="text-xs text-muted-foreground">تبلیغات قابل مدیریت از Admin</div></Link><Link href={`/${locale}/admin/homepage`} className="rounded-2xl border border-border bg-card p-4 hover:bg-muted/40"><Package className="mb-2 h-5 w-5 text-primary" /><div className="font-semibold">Homepage Builder</div><div className="text-xs text-muted-foreground">کنترل ترتیب Sectionها</div></Link><Link href={`/${locale}/admin/media`} className="rounded-2xl border border-border bg-card p-4 hover:bg-muted/40"><Package className="mb-2 h-5 w-5 text-primary" /><div className="font-semibold">Media Library</div><div className="text-xs text-muted-foreground">مرکز مدیریت رسانه</div></Link><Link href={`/${locale}/admin/analytics`} className="rounded-2xl border border-border bg-card p-4 hover:bg-muted/40"><FolderTree className="mb-2 h-5 w-5 text-primary" /><div className="font-semibold">Analytics Center</div><div className="text-xs text-muted-foreground">گزارش کامل Marketplace</div></Link></div>
    </div>
  );
}
