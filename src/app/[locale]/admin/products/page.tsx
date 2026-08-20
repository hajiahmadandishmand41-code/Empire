import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/features/admin/components/data-table';
import { SearchForm } from '@/features/admin/components/search-form';
import { Pagination } from '@/features/admin/components/pagination';
import { DeleteIconButton, EditIconButton } from '@/features/admin/components/action-buttons';
import { HomepageFeatureToggle } from '@/features/admin/components/homepage-feature-toggle';
import { listAdminProducts } from '@/features/admin/lib/queries';
import type { AdminProductRow } from '@/features/admin/lib/mock-data';
import { formatDate, formatMoney } from '@/features/admin/lib/format';
import { EmptyState } from '@/features/admin/components/empty-state';
import { AlertTriangle, Package, Plus } from 'lucide-react';

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
    { key: 'product', header: 'محصول', cell: (r) => <div className="min-w-[220px]"><div className="flex items-center gap-2"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Package className="h-4 w-4" /></div><div className="min-w-0"><div className="truncate font-bold text-foreground">{r.name}</div><div dir="ltr" className="truncate text-[11px] font-mono text-muted-foreground">{r.slug}</div></div></div></div> },
    { key: 'category', header: t('category'), cell: (r) => <span className="font-medium">{r.categoryName}</span> },
    { key: 'region', header: t('region'), cell: (r) => <span className="text-muted-foreground">{r.region}</span> },
    { key: 'price', header: t('price'), cell: (r) => <span className="whitespace-nowrap font-black text-foreground">{formatMoney(r.price, r.currency)}</span> },
    { key: 'stock', header: t('stock'), cell: (r) => <span className={r.inStock ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400' : 'inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-400'}>{r.inStock ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : <AlertTriangle className="h-3 w-3" />}{r.inStock ? t('available') : t('unavailable')}</span> },
    { key: 'featured', header: 'ویژه', headerClassName: 'w-14', className: 'text-center', cell: (r) => <HomepageFeatureToggle id={r.id} active={Boolean(r.isHero)} /> },
    { key: 'created', header: t('created'), cell: (r) => <span className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(r.createdAt)}</span> },
    { key: 'actions', header: 'عملیات', headerClassName: 'w-24', className: 'text-end', cell: (r) => <div className="flex items-center justify-end gap-2"><EditIconButton href={`/${locale}/admin/products/${r.id}`} label={ta('edit')} /><DeleteIconButton endpoint={`/api/admin/products/${r.id}`} confirmMessage={ta('confirmDelete')} labels={{ deleted: ta('deleted'), failed: ta('deleteFailed'), network: ta('network'), aria: ta('delete') }} /></div> },
  ];

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Package className="h-5 w-5" /></div><div><h2 className="font-display text-2xl font-black text-foreground">مدیریت محصولات</h2><p className="mt-1 text-xs text-muted-foreground">جستجو، بررسی موجودی، مدیریت وضعیت و ویرایش محصولات Marketplace</p></div></div></div><Button asChild size="sm"><Link href={`/${locale}/admin/products/new`}><Plus className="h-4 w-4" />{t('add')}</Link></Button></header>
    <Card className="space-y-4 p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><SearchForm placeholder={t('search')} /><span className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground">{result.total.toLocaleString('fa-AF')} محصول</span></div>{result.total === 0 ? <EmptyState title={t('empty')} description={t('emptyHint')} /> : <DataTable columns={columns} rows={result.items} rowKey={(r) => r.id} />}<Pagination page={result.page} pageSize={result.pageSize} total={result.total} /></Card>
  </div>;
}
