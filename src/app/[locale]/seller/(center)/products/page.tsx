import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/features/admin/components/data-table';
import { SearchForm } from '@/features/admin/components/search-form';
import { Pagination } from '@/features/admin/components/pagination';
import { EmptyState } from '@/features/admin/components/empty-state';
import { formatDate, formatMoney } from '@/features/admin/lib/format';
import { listSellerProducts, type SellerProductRow } from '@/features/seller/lib/products';
import { getCurrentUser } from '@/lib/auth/current-user';
import { SellerProductActions } from '@/features/seller/components/seller-product-actions';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}

export default async function SellerProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(sp.pageSize ?? '10', 10) || 10));
  const user = await getCurrentUser();
  const sellerId = user && user.role === 'seller' ? user.id : undefined;
  const result = await listSellerProducts({ q: sp.q, page, pageSize, sellerId });

  const base = `/${locale}/seller/products`;

  const columns: Column<SellerProductRow>[] = [
    {
      key: 'name',
      header: 'محصول',
      cell: (r) => (
        <div className="min-w-0">
          <div className="truncate font-bold text-foreground">{r.name}</div>
          <div className="truncate font-mono text-[11px] text-muted-foreground">{r.slug}</div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'قیمت',
      cell: (r) => (
        <span className="font-bold text-foreground">{formatMoney(r.price, r.currency)}</span>
      ),
    },
    {
      key: 'stock',
      header: 'وضعیت',
      cell: (r) => (
        <span
          className={
            r.isActive
              ? 'inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400'
              : 'inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground'
          }
        >
          {r.isActive ? 'فعال' : 'غیرفعال'}
        </span>
      ),
    },
    {
      key: 'inventory',
      header: 'موجودی',
      cell: (r) => (
        <span className={r.stockQuantity <= 0 ? 'font-bold text-red-600 dark:text-red-400' : r.stockQuantity <= 5 ? 'font-bold text-amber-600 dark:text-amber-400' : 'font-medium text-emerald-700 dark:text-emerald-400'}>
          {r.stockQuantity <= 0 ? 'ناموجود' : `${r.stockQuantity.toLocaleString('fa-IR')} عدد`}
        </span>
      ),
    },
    { key: 'created', header: 'ایجاد شده', cell: (r) => <span className="text-muted-foreground">{formatDate(r.createdAt)}</span> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      className: 'text-end',
      cell: (r) => (
        <SellerProductActions id={r.id} name={r.name} editHref={`${base}/${r.id}/edit`} />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold text-primary">Seller Center / Products</p>
          <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-foreground">محصولات من</h2>
          <p className="mt-1 text-sm text-muted-foreground">مدیریت محصولات فروشگاه شما — افزودن، ویرایش و حذف</p>
        </div>
        <Link href={`${base}/new`}>
          <Button className="btn-empire gap-2" size="sm"><Plus className="h-4 w-4" />افزودن محصول</Button>
        </Link>
      </header>

      <div className="card-luxury space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <SearchForm placeholder="جستجو در محصولات…" />
        </div>

        {result.total === 0 ? (
          <EmptyState title="محصولی یافت نشد" description="با افزودن محصول جدید شروع کنید." />
        ) : (
          <DataTable columns={columns} rows={result.items} rowKey={(r) => r.id} />
        )}

        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} />
      </div>
    </div>
  );
}
