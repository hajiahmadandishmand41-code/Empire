import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/features/admin/components/data-table';
import { SearchForm } from '@/features/admin/components/search-form';
import { Pagination } from '@/features/admin/components/pagination';
import { DeleteIconButton, EditIconButton } from '@/features/admin/components/action-buttons';
import { listAdminProducts } from '@/features/admin/lib/queries';
import type { AdminProductRow } from '@/features/admin/lib/mock-data';
import { formatDate, formatMoney } from '@/features/admin/lib/format';
import { EmptyState } from '@/features/admin/components/empty-state';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
interface Props { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; page?: string; pageSize?: string }> }

export default async function AdminProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations('admin.productsPage');
  const ta = await getTranslations('admin.actions');
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(sp.pageSize ?? '10', 10) || 10));
  const result = await listAdminProducts({ q: sp.q, page, pageSize });

  const columns: Column<AdminProductRow>[] = [
    { key: 'name', header: t('product'), cell: (r) => <div className="min-w-0"><div className="truncate font-medium text-foreground">{r.name}</div><div className="truncate font-mono text-xs text-muted-foreground">{r.slug}</div></div> },
    { key: 'category', header: t('category'), cell: (r) => r.categoryName },
    { key: 'region', header: t('region'), cell: (r) => r.region },
    { key: 'price', header: t('price'), cell: (r) => <span className="font-semibold text-navy-800">{formatMoney(r.price, r.currency)}</span> },
    { key: 'stock', header: t('stock'), cell: (r) => <span className={r.inStock ? 'inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700' : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'}>{r.inStock ? t('available') : t('unavailable')}</span> },
    { key: 'created', header: t('created'), cell: (r) => formatDate(r.createdAt) },
    { key: 'actions', header: '', headerClassName: 'w-24', className: 'text-end', cell: (r) => <div className="flex items-center justify-end gap-2"><EditIconButton /><DeleteIconButton endpoint={`/api/admin/products/${r.id}`} confirmMessage={ta('confirmDelete')} /></div> },
  ];

  return <div className="space-y-4">
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-display text-2xl font-bold text-navy-800">{t('title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p></div><Button asChild size="sm"><Link href={`/${locale}/admin/products/new`}><Plus className="h-4 w-4" />{t('add')}</Link></Button></header>
    <Card className="space-y-4 p-4"><div className="flex flex-wrap items-center gap-3"><SearchForm placeholder={t('search')} /></div>{result.total === 0 ? <EmptyState title={t('empty')} description={t('emptyHint')} /> : <DataTable columns={columns} rows={result.items} rowKey={(r) => r.id} />}<Pagination page={result.page} pageSize={result.pageSize} total={result.total} /></Card>
  </div>;
}
