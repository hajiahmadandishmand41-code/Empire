import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Store, UserCheck, UserX, Clock3, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/features/admin/components/data-table';
import { SearchForm } from '@/features/admin/components/search-form';
import { Pagination } from '@/features/admin/components/pagination';
import { EmptyState } from '@/features/admin/components/empty-state';
import { SellerActions, SellerStatusBadge } from '@/features/admin/components/seller-actions';
import { CreateSellerButton } from '@/features/admin/components/create-seller-button';
import { listAdminSellers } from '@/features/admin/lib/queries';
import type { AdminSellerRow, SellerStatus } from '@/features/admin/lib/mock-data';
import { formatDate } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';
interface Props { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; page?: string; status?: string }> }

const statusItems: Array<{ key: SellerStatus | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'all', label: 'همه فروشندگان', icon: Store },
  { key: 'pending', label: 'در انتظار بررسی', icon: Clock3 },
  { key: 'approved', label: 'تأیید شده', icon: UserCheck },
  { key: 'rejected', label: 'رد شده', icon: UserX },
];

export default async function AdminSellersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations('admin.sellersPage');
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const status = (sp.status as SellerStatus | 'all' | undefined) ?? 'all';
  const result = await listAdminSellers({ q: sp.q, page, pageSize: 10, status });

  const columns: Column<AdminSellerRow>[] = [
    {
      key: 'seller',
      header: t('seller'),
      cell: (r) => (
        <div className="min-w-0">
          <Link href={`/${locale}/admin/sellers/${r.id}`} className="block truncate font-semibold text-foreground hover:text-primary hover:underline">
            {r.shopName ?? r.fullName}
          </Link>
          <div className="truncate text-xs text-muted-foreground">{r.fullName} · {r.email ?? r.phone ?? '—'}</div>
        </div>
      ),
    },
    { key: 'status', header: t('status'), cell: (r) => <SellerStatusBadge status={r.sellerStatus} /> },
    { key: 'products', header: t('products'), cell: (r) => <span className="font-semibold">{r.productCount.toLocaleString('fa-IR')}</span> },
    { key: 'active', header: 'حساب', cell: (r) => <span className={r.isActive ? 'inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700' : 'inline-flex rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground'}>{r.isActive ? 'فعال' : 'غیرفعال'}</span> },
    { key: 'created', header: t('registered'), cell: (r) => formatDate(r.createdAt) },
    { key: 'actions', header: 'عملیات', className: 'text-end', cell: (r) => <SellerActions sellerId={r.id} status={r.sellerStatus} isActive={r.isActive} /> },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"><Store className="h-3.5 w-3.5" /> مرکز فروشندگان</div>
          <h2 className="font-display text-2xl font-black text-foreground">{t('title')}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">بررسی، تأیید و مدیریت وضعیت فروشندگان و فروشگاه‌های Marketplace از یک مرکز واحد.</p>
        </div>
        <CreateSellerButton />
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statusItems.map((item) => {
          const Icon = item.icon;
          const href = `/${locale}/admin/sellers${item.key === 'all' ? '' : `?status=${item.key}`}`;
          const active = status === item.key;
          return (
            <Link key={item.key} href={href} className={`rounded-2xl border p-4 transition-all ${active ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-border bg-card hover:-translate-y-0.5 hover:bg-muted/30'}`}>
              <div className="flex items-start justify-between gap-3"><span className="text-xs font-semibold text-muted-foreground">{item.label}</span><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span></div>
              <div className="mt-3 text-2xl font-black text-foreground">{item.key === 'all' ? result.total.toLocaleString('fa-IR') : result.items.filter((s) => s.sellerStatus === item.key).length.toLocaleString('fa-IR')}</div>
              <p className="mt-1 text-[11px] text-muted-foreground">برای مشاهده فهرست این وضعیت کلیک کنید.</p>
            </Link>
          );
        })}
      </section>

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h3 className="text-base font-bold">فهرست فروشندگان</h3><p className="mt-1 text-xs text-muted-foreground">وضعیت فروشگاه، تعداد محصولات و عملیات مدیریتی را از همین جدول کنترل کنید.</p></div>
          <div className="w-full lg:max-w-sm"><SearchForm placeholder={t('search')} /></div>
        </div>
        {result.total === 0 ? <EmptyState title={t('empty')} description={t('emptyHint')} /> : <DataTable columns={columns} rows={result.items} rowKey={(r) => r.id} />}
        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} />
      </Card>
    </div>
  );
}
