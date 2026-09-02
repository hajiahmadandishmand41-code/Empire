import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Package,
  Plus,
  ShoppingBag,
  Store,
  WalletCards,
} from 'lucide-react';
import { requireSeller } from '@/lib/auth/roles';
import { getSellerStats } from '@/features/seller/lib/queries';
import { getSellerReport } from '@/features/seller/lib/reports';
import { getWalletSummary } from '@/features/seller/lib/wallet-queries';
import { formatMoney } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function SellerDashboardPage({ params }: Props) {
  const { locale } = await params;
  const user = await requireSeller({ locale });
  const sellerId = user.id;
  const [stats, report, wallet] = await Promise.all([
    getSellerStats(sellerId),
    getSellerReport(sellerId),
    getWalletSummary(sellerId),
  ]);

  const base = `/${locale}/seller`;
  const shop = user.sellerShopName || 'فروشگاه من';

  const metrics = [
    { label: 'فروش کل', value: formatMoney(stats.revenue, stats.currency), href: `${base}/analytics`, icon: BarChart3 },
    { label: 'سفارش‌ها', value: stats.orders.toLocaleString('fa-IR'), href: `${base}/orders`, icon: ShoppingBag },
    { label: 'محصولات', value: stats.products.toLocaleString('fa-IR'), href: `${base}/products`, icon: Package },
    { label: 'کیف پول', value: formatMoney(wallet.balance, wallet.currency), href: `${base}/wallet`, icon: WalletCards },
  ];

  const quick = [
    { label: 'ثبت محصول', href: `${base}/products/new`, icon: Plus, primary: true },
    { label: 'مدیریت فروشگاه', href: `${base}/store`, icon: Store },
    { label: 'موجودی', href: `${base}/inventory`, icon: Boxes },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6" dir="rtl">
      <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
        <div className="grid gap-7 p-6 lg:grid-cols-[1.3fr_.7fr] lg:p-8">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Seller workspace
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">سلام {user.fullName} 👋</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              {shop} از همین صفحه مدیریت می‌شود؛ محصولات، سفارش‌ها، موجودی، فروشگاه و جریان مالی شما به اطلاعات واقعی Empire متصل است.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {quick.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={item.primary
                      ? 'inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-sm hover:bg-emerald-700'
                      : 'inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50'}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-300">فروشگاه فعال</div>
                <div className="mt-2 text-xl font-black">{shop}</div>
              </div>
              <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300"><Store className="h-5 w-5" /></div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-slate-400">در انتظار</div><div className="mt-1 text-xl font-black">{stats.pendingOrders.toLocaleString('fa-IR')}</div></div>
              <div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-slate-400">ناموجود</div><div className="mt-1 text-xl font-black">{stats.outOfStockProducts.toLocaleString('fa-IR')}</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link key={metric.label} href={metric.href} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Icon className="h-5 w-5" /></div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-600" />
              </div>
              <div className="mt-5 text-xs font-bold text-slate-500">{metric.label}</div>
              <div className="mt-1 text-2xl font-black tracking-tight">{metric.value}</div>
            </Link>
          );
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-base font-black">خلاصه عملکرد</h2><p className="mt-1 text-xs text-slate-500">آخرین شاخص‌های فروشگاه</p></div>
            <Link href={`${base}/analytics`} className="text-xs font-black text-emerald-700">جزئیات <ArrowLeft className="mr-1 inline h-3.5 w-3.5" /></Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ['اقلام فروخته‌شده', report.totals.unitsSold],
              ['تحویل‌شده', report.totals.deliveredOrders],
              ['ارسال‌شده', report.totals.shippedOrders],
              ['لغوشده', report.totals.cancelledOrders],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl bg-slate-50 p-4">
                <div className="text-[11px] text-slate-500">{label}</div>
                <div className="mt-1 text-xl font-black">{Number(value).toLocaleString('fa-IR')}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="text-base font-black">پرفروش‌ترین محصولات</h2><p className="mt-1 text-xs text-slate-500">بر اساس فروش ثبت‌شده</p></div><Package className="h-5 w-5 text-emerald-600" /></div>
          <div className="mt-4 space-y-2">
            {report.topProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">هنوز داده‌ای برای نمایش وجود ندارد.</div>
            ) : report.topProducts.slice(0, 5).map((product) => (
              <div key={product.productId} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="min-w-0"><div className="truncate text-sm font-bold">{product.name}</div><div className="mt-0.5 text-[11px] text-slate-500">{product.unitsSold.toLocaleString('fa-IR')} فروش</div></div>
                <div className="shrink-0 text-xs font-black">{formatMoney(product.revenue, report.currency)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
