import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Users, Package, ShoppingBag, FolderTree, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/features/admin/components/stat-card';
import { BarChart } from '@/features/admin/components/bar-chart';
import { StatusBadge } from '@/features/admin/components/status-badge';
import { getAdminStats, listAdminOrders, getSalesByDay, getTopProducts, listAdminSellers } from '@/features/admin/lib/queries';
import { formatDateTime, formatMoney } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ locale: string }> }

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('admin.dashboard');
  const [stats, sales, top, latest, pendingSellers] = await Promise.all([
    getAdminStats(), getSalesByDay(14), getTopProducts(5),
    listAdminOrders({ page: 1, pageSize: 6 }),
    listAdminSellers({ status: 'pending', page: 1, pageSize: 5 }),
  ]);
  const isMock = stats.source === 'mock';

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="font-display text-2xl font-bold text-navy-800">{t('title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p></div>
        {isMock && <span className="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700">{t('mock')}</span>}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('users')} value={stats.users.toLocaleString(locale)} icon={<Users className="h-5 w-5" />} tone="info" />
        <StatCard label={t('products')} value={stats.products.toLocaleString(locale)} icon={<Package className="h-5 w-5" />} tone="default" />
        <StatCard label={t('orders')} value={stats.orders.toLocaleString(locale)} icon={<ShoppingBag className="h-5 w-5" />} tone="success" />
        <StatCard label={t('categories')} value={stats.categories.toLocaleString(locale)} icon={<FolderTree className="h-5 w-5" />} tone="warning" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><div><h3 className="text-base font-semibold text-foreground">{t('sales14')}</h3><p className="text-xs text-muted-foreground">{t('revenue')}: {formatMoney(stats.revenue, stats.currency)}</p></div><DollarSign className="h-5 w-5 text-muted-foreground" /></div>
          <BarChart data={sales.items.map((s) => ({ label: s.date, value: s.revenue }))} formatValue={(v) => formatMoney(v)} ariaLabel={t('sales14')} />
        </Card>
        <Card className="p-5"><h3 className="mb-4 text-base font-semibold text-foreground">{t('topProducts')}</h3>{top.items.length === 0 ? <p className="text-sm text-muted-foreground">{t('noData')}</p> : <ol className="space-y-3">{top.items.map((p, i) => <li key={p.slug} className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span><div className="min-w-0"><div className="truncate text-sm font-medium text-foreground">{p.name}</div><div className="text-xs text-muted-foreground">{p.units} {t('products').toLocaleLowerCase()}</div></div></div><span className="shrink-0 text-sm font-semibold text-navy-800">{formatMoney(p.revenue)}</span></li>)}</ol>}</Card>
      </section>

      <Card className="p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-base font-semibold text-foreground">{t('latestOrders')}</h3><Link href={`/${locale}/admin/orders`} className="text-xs font-medium text-primary hover:underline">{t('viewAll')} ←</Link></div>{latest.items.length === 0 ? <p className="text-sm text-muted-foreground">{t('noOrders')}</p> : <ul className="divide-y divide-border">{latest.items.map((o) => <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><Link href={`/${locale}/admin/orders/${o.id}`} className="font-mono text-sm font-medium text-primary hover:underline">{o.reference}</Link><div className="text-xs text-muted-foreground">{o.customerName} · {formatDateTime(o.createdAt)}</div></div><div className="flex items-center gap-3"><StatusBadge status={o.status} /><span className="text-sm font-semibold text-navy-800">{formatMoney(o.total, o.currency)}</span></div></li>)}</ul>}</Card>

      {pendingSellers.total > 0 && <Card className="p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-base font-semibold text-foreground">{t('pendingSellers')}</h3><p className="text-xs text-muted-foreground">{t('pendingCount', { count: pendingSellers.total })}</p></div><Link href={`/${locale}/admin/sellers?status=pending`} className="text-xs font-medium text-primary hover:underline">{t('viewAll')} ←</Link></div><ul className="divide-y divide-border">{pendingSellers.items.map((s) => <li key={s.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><div className="truncate text-sm font-medium text-foreground">{s.shopName ?? s.fullName}</div><div className="truncate text-xs text-muted-foreground">{s.fullName} · {s.email ?? s.phone ?? '—'}</div></div><Link href={`/${locale}/admin/sellers?status=pending`} className="inline-flex h-8 items-center rounded-md border border-primary/40 bg-primary/10 px-3 text-xs font-medium text-primary hover:bg-primary/20">{t('review')}</Link></li>)}</ul></Card>}
    </div>
  );
}
