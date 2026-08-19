import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/features/admin/components/data-table';
import { SearchForm } from '@/features/admin/components/search-form';
import { Pagination } from '@/features/admin/components/pagination';
import { EmptyState } from '@/features/admin/components/empty-state';
import { SellerActions } from '@/features/admin/components/seller-actions';
import { CreateSellerButton } from '@/features/admin/components/create-seller-button';
import { listAdminSellers } from '@/features/admin/lib/queries';
import type { AdminSellerRow, SellerStatus } from '@/features/admin/lib/mock-data';
import { formatDate } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';
interface Props { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; page?: string; status?: string }> }

export default async function AdminSellersPage({ params, searchParams }: Props) {
  const { locale } = await params; const sp = await searchParams; const t = await getTranslations('admin.sellersPage');
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const status = (sp.status as SellerStatus | 'all' | undefined) ?? 'all';
  const result = await listAdminSellers({ q: sp.q, page, pageSize: 10, status });
  const tabs: { key: SellerStatus | 'all'; label: string }[] = [
    { key: 'all', label: t('all') }, { key: 'pending', label: t('pending') }, { key: 'approved', label: t('approved') }, { key: 'rejected', label: t('rejected') },
  ];
  const columns: Column<AdminSellerRow>[] = [
    { key: 'name', header: t('seller'), cell: (r) => <div className="min-w-0"><div className="truncate font-medium text-foreground">{r.shopName ?? r.fullName}</div><div className="truncate text-xs text-muted-foreground">{r.fullName} · {r.email ?? r.phone ?? '—'}</div></div> },
    { key: 'products', header: t('products'), cell: (r) => r.productCount },
    { key: 'created', header: t('registered'), cell: (r) => formatDate(r.createdAt) },
    { key: 'actions', header: t('status'), cell: (r) => <SellerActions sellerId={r.id} status={r.sellerStatus} isActive={r.isActive} /> },
  ];
  return <div className="space-y-4"><header className="flex items-start justify-between gap-4"><div><h2 className="font-display text-2xl font-bold text-foreground">{t('title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p></div><CreateSellerButton /></header><Card className="space-y-4 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">{tabs.map((tab) => { const href = `/${locale}/admin/sellers` + (tab.key === 'all' ? '' : `?status=${tab.key}`); const active = status === tab.key; return <Link key={tab.key} href={href} className={'rounded-md px-3 py-1 text-xs font-medium transition-colors ' + (active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{tab.label}</Link>; })}</div><div className="min-w-[240px] flex-1"><SearchForm placeholder={t('search')} /></div></div>{result.total === 0 ? <EmptyState title={t('empty')} description={t('emptyHint')} /> : <DataTable columns={columns} rows={result.items} rowKey={(r) => r.id} />}<Pagination page={result.page} pageSize={result.pageSize} total={result.total} /></Card></div>;
}
