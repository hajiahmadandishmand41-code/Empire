import Link from 'next/link';
import { requireSeller } from '@/lib/auth/roles';
import { getSellerStats } from '@/features/seller/lib/queries';
import { getSellerReport } from '@/features/seller/lib/reports';
import { getWalletSummary } from '@/features/seller/lib/wallet-queries';
import { formatMoney } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';
export default async function SellerDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await requireSeller({ locale });
  const sellerId = user.role === 'seller' ? user.id : user.id;
  const [stats, report, wallet] = await Promise.all([getSellerStats(sellerId), getSellerReport(sellerId), getWalletSummary(sellerId)]);
  const cards = [
    ['محصولات', stats.products.toLocaleString('fa-IR'), 'products'],
    ['سفارش‌ها', stats.orders.toLocaleString('fa-IR'), 'orders'],
    ['در انتظار', stats.pendingOrders.toLocaleString('fa-IR'), 'orders'],
    ['درآمد', formatMoney(stats.revenue, stats.currency), 'analytics'],
    ['موجودی کیف پول', formatMoney(wallet.balance, wallet.currency), 'wallet'],
    ['محصولات ناموجود', stats.outOfStockProducts.toLocaleString('fa-IR'), 'inventory'],
  ];
  return <div className="mx-auto max-w-7xl space-y-6">
    <div className="rounded-3xl border bg-card p-6 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold text-primary">Seller Center</p><h1 className="mt-1 text-2xl font-black">خوش آمدید، {user.fullName}</h1><p className="mt-2 text-sm text-muted-foreground">همه چیز فروشگاه شما از یکجا مدیریت می‌شود.</p></div><Link href={`/${locale}/seller/products/new`} className="rounded-2xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground">ثبت محصول جدید</Link></div></div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{cards.map(([label,value,slug])=><Link key={label} href={`/${locale}/seller/${slug}`} className="rounded-3xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><p className="text-xs font-bold text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black tracking-tight">{value}</p></Link>)}</section>
    <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-3xl border bg-card p-5 shadow-sm"><h2 className="text-base font-black">خلاصه فروش</h2><div className="mt-4 grid grid-cols-2 gap-3">{[['کل اقلام',report.totals.unitsSold],['تحویل‌شده',report.totals.deliveredOrders],['ارسال‌شده',report.totals.shippedOrders],['لغوشده',report.totals.cancelledOrders]].map(([k,v])=><div key={String(k)} className="rounded-2xl bg-muted/60 p-4"><div className="text-xs text-muted-foreground">{k}</div><div className="mt-1 text-xl font-black">{Number(v).toLocaleString('fa-IR')}</div></div>)}</div><Link href={`/${locale}/seller/analytics`} className="mt-4 inline-block text-xs font-bold text-primary">مشاهده تحلیل کامل ←</Link></section><section className="rounded-3xl border bg-card p-5 shadow-sm"><h2 className="text-base font-black">پرفروش‌ترین محصولات</h2><div className="mt-4 space-y-3">{report.topProducts.length===0?<p className="text-sm text-muted-foreground">هنوز فروشی ثبت نشده است.</p>:report.topProducts.map((p)=><div key={p.productId} className="flex items-center justify-between rounded-2xl bg-muted/60 p-3"><div className="min-w-0"><div className="truncate text-sm font-bold">{p.name}</div><div className="text-xs text-muted-foreground">{p.unitsSold.toLocaleString('fa-IR')} فروش</div></div><div className="text-sm font-black">{formatMoney(p.revenue, report.currency)}</div></div>)}</div></section></div>
  </div>;
}
