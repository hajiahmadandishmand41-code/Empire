import Link from 'next/link';
import { AlertTriangle, ArrowLeft, BarChart3, CheckCircle2, ChevronLeft, Clock3, DollarSign, FolderTree, Megaphone, Package, ShoppingBag, Store, UserCog, Users } from 'lucide-react';
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
  const pendingOrderCount = d.recentOrders.filter((order) => ['pending', 'confirmed', 'processing'].includes(order.status)).length;
  const actionCount = d.lowStockCount + d.pendingSellers + pendingOrderCount + d.inactiveProducts;

  return (
    <div className="space-y-7 pb-10">
      <header className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">مرکز عملیات</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden /> داده زنده</span>
          </div>
          <h1 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">مرکز مدیریت امپایر</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">وضعیت فروشگاه، سفارش‌ها، موجودی و فروشندگان را از یک صفحه کنترل کنید.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${locale}/admin/orders`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">سفارش‌ها <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden /></Link>
          <Link href={`/${locale}/admin/products`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground">مدیریت محصولات</Link>
        </div>
      </header>

      <section aria-labelledby="business-overview-title">
        <div className="mb-3 flex items-end justify-between gap-3"><div><h2 id="business-overview-title" className="text-base font-black">وضعیت کسب‌وکار</h2><p className="mt-1 text-xs text-muted-foreground">اعداد کلیدی برای تصمیم‌گیری سریع</p></div><BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden /></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="فروش امروز" value={formatMoney(d.today, d.currency)} icon={<DollarSign className="h-5 w-5" />} tone="success" />
          <StatCard label="فروش این هفته" value={formatMoney(d.week, d.currency)} icon={<DollarSign className="h-5 w-5" />} tone="info" />
          <StatCard label="فروش این ماه" value={formatMoney(d.month, d.currency)} icon={<DollarSign className="h-5 w-5" />} tone="default" />
          <StatCard label="میانگین ارزش سفارش" value={formatMoney(d.avgOrderValue, d.currency)} icon={<ShoppingBag className="h-5 w-5" />} tone="warning" />
        </div>
      </section>

      <section aria-labelledby="actions-title">
        <div className="mb-3 flex items-end justify-between gap-3"><div><h2 id="actions-title" className="text-base font-black">مرکز اقدام</h2><p className="mt-1 text-xs text-muted-foreground">مواردی که احتمالاً امروز نیاز به رسیدگی دارند</p></div><span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">{actionCount} مورد</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link href={`/${locale}/admin/orders?status=pending`} className="group rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Clock3 className="h-5 w-5" /></span><ChevronLeft className="h-4 w-4 text-muted-foreground transition group-hover:-translate-x-0.5 rtl:rotate-180" /></div><p className="mt-4 text-2xl font-black">{pendingOrderCount.toLocaleString(locale)}</p><p className="mt-1 text-sm font-semibold">سفارش نیازمند پیگیری</p><p className="mt-1 text-xs text-muted-foreground">بازبینی سفارش‌های در انتظار</p></Link>
          <Link href={`/${locale}/admin/products?stock=low`} className="group rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600"><AlertTriangle className="h-5 w-5" /></span><ChevronLeft className="h-4 w-4 text-muted-foreground transition group-hover:-translate-x-0.5 rtl:rotate-180" /></div><p className="mt-4 text-2xl font-black">{d.lowStockCount.toLocaleString(locale)}</p><p className="mt-1 text-sm font-semibold">محصول با موجودی کم</p><p className="mt-1 text-xs text-muted-foreground">جلوگیری از ناموجود شدن</p></Link>
          <Link href={`/${locale}/admin/sellers?status=pending`} className="group rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600"><UserCog className="h-5 w-5" /></span><ChevronLeft className="h-4 w-4 text-muted-foreground transition group-hover:-translate-x-0.5 rtl:rotate-180" /></div><p className="mt-4 text-2xl font-black">{d.pendingSellers.toLocaleString(locale)}</p><p className="mt-1 text-sm font-semibold">درخواست فروشندگی</p><p className="mt-1 text-xs text-muted-foreground">بررسی و تأیید فروشندگان</p></Link>
          <Link href={`/${locale}/admin/products?status=inactive`} className="group rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600"><Package className="h-5 w-5" /></span><ChevronLeft className="h-4 w-4 text-muted-foreground transition group-hover:-translate-x-0.5 rtl:rotate-180" /></div><p className="mt-4 text-2xl font-black">{d.inactiveProducts.toLocaleString(locale)}</p><p className="mt-1 text-sm font-semibold">محصول غیرفعال</p><p className="mt-1 text-xs text-muted-foreground">بازبینی وضعیت انتشار</p></Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-4"><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-black">روند فروش ۳۰ روز اخیر</h2><p className="mt-1 text-xs text-muted-foreground">درآمد ثبت‌شده بر اساس داده واقعی</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">۳۰ روز</span></div></div>
          <div className="p-5"><BarChart data={d.salesByDay.map((s) => ({ label: s.date, value: s.revenue }))} formatValue={(value) => formatMoney(value, d.currency)} ariaLabel="روند فروش ۳۰ روز اخیر" /></div>
        </Card>
        <Card className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-black">خلاصه عملکرد</h2><p className="mt-1 text-xs text-muted-foreground">شاخص‌های عملیاتی</p></div><CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden /></div><div className="space-y-4"><Metric label="سفارش‌های جدید" value={d.newOrders.toLocaleString(locale)} /><Metric label="کاربران" value={d.users.toLocaleString(locale)} /><Metric label="فروشندگان" value={d.sellerCount.toLocaleString(locale)} /><Metric label="محصولات" value={d.products.toLocaleString(locale)} /><Metric label="درآمد کل" value={formatMoney(d.revenue, d.currency)} /></div></Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-black">محصولات پرفروش</h2><p className="mt-1 text-xs text-muted-foreground">محصولات با بیشترین سهم درآمد</p></div><Link href={`/${locale}/admin/products`} className="text-xs font-bold text-primary hover:underline">همه محصولات</Link></div><ol className="space-y-3">{d.topProducts.map((product, index) => <li key={`${product.name}-${index}`} className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{product.name}</span><span className="text-sm font-bold">{formatMoney(product.revenue, d.currency)}</span></li>)}{d.topProducts.length === 0 && <li className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">داده‌ای برای نمایش وجود ندارد.</li>}</ol></Card>
        <Card className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-black">فروشندگان برتر</h2><p className="mt-1 text-xs text-muted-foreground">فروش بر اساس فروشنده</p></div><Link href={`/${locale}/admin/sellers`} className="text-xs font-bold text-primary hover:underline">همه فروشندگان</Link></div><ol className="space-y-3">{d.topSellers.map((seller, index) => <li key={`${seller.name}-${index}`} className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-xs font-black text-indigo-600">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{seller.name}</span><span className="text-sm font-bold">{formatMoney(seller.revenue, d.currency)}</span></li>)}{d.topSellers.length === 0 && <li className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">داده‌ای برای نمایش وجود ندارد.</li>}</ol></Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden p-0"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-base font-black">آخرین سفارش‌ها</h2><p className="mt-1 text-xs text-muted-foreground">جدیدترین تراکنش‌های ثبت‌شده</p></div><Link href={`/${locale}/admin/orders`} className="text-xs font-bold text-primary hover:underline">مشاهده همه</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead className="bg-muted/30"><tr><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">مرجع</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">مشتری</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">مبلغ</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">وضعیت</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">تاریخ</th></tr></thead><tbody className="divide-y divide-border">{d.recentOrders.map((order) => <tr key={order.id} className="transition hover:bg-muted/20"><td className="px-4 py-3 font-mono text-xs font-semibold">{order.reference}</td><td className="px-4 py-3">{order.address.fullName}</td><td className="px-4 py-3 font-bold">{formatMoney(order.total, order.currency)}</td><td className="px-4 py-3"><StatusBadge status={order.status} /></td><td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(order.createdAt.toISOString())}</td></tr>)}</tbody></table></div></Card>
        <div className="space-y-4"><Card className="border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900 dark:bg-amber-950/20"><div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden /><h2 className="text-base font-black">هشدار موجودی</h2></div><div className="space-y-2">{d.lowStock.slice(0, 5).map((product) => <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/70 bg-background/60 px-3 py-2.5 text-sm dark:border-amber-900"><span className="truncate font-semibold">{product.name}</span><span className="shrink-0 font-black">{product.stockQuantity === 0 ? 'ناموجود' : `${product.stockQuantity} عدد`}</span></div>)}{d.lowStock.length === 0 && <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" aria-hidden /> موجودی بحرانی ندارید.</div>}</div><Link href={`/${locale}/admin/products?stock=low`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">مدیریت موجودی <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /></Link></Card><Card className="p-5"><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-base font-black">درخواست‌های فروشندگی</h2><p className="mt-1 text-xs text-muted-foreground">مواردی که نیازمند بررسی هستند</p></div><Store className="h-5 w-5 text-primary" aria-hidden /></div><div className="space-y-2">{d.sellers.filter((seller) => seller.sellerStatus === 'pending').slice(0, 5).map((seller) => <div key={seller.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm"><span className="truncate font-semibold">{seller.sellerShopName ?? seller.fullName}</span><span className="shrink-0 text-xs font-bold text-amber-600">در انتظار</span></div>)}{d.pendingSellers === 0 && <div className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">درخواست جدیدی در انتظار نیست.</div>}</div><Link href={`/${locale}/admin/sellers?status=pending`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">بررسی درخواست‌ها <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /></Link></Card></div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><QuickAction href={`/${locale}/admin/banners`} icon={<Megaphone className="h-5 w-5" />} title="مدیریت بنرها" description="کمپین‌ها و جایگاه‌ها" /><QuickAction href={`/${locale}/admin/homepage`} icon={<FolderTree className="h-5 w-5" />} title="سازنده صفحه اصلی" description="ترتیب و نمایش بخش‌ها" /><QuickAction href={`/${locale}/admin/media`} icon={<Package className="h-5 w-5" />} title="کتابخانه رسانه" description="تصاویر و فایل‌ها" /><QuickAction href={`/${locale}/admin/analytics`} icon={<BarChart3 className="h-5 w-5" />} title="مرکز تحلیل" description="گزارش‌های عمیق‌تر" /></section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-3 last:border-0 last:pb-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-black">{value}</span></div>;
}

function QuickAction({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return <Link href={href} className="group rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105">{icon}</span><div className="mt-3 font-black">{title}</div><div className="mt-1 text-xs text-muted-foreground">{description}</div></Link>;
}
