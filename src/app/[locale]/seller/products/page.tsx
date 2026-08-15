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
          <div className="truncate font-medium text-foreground">{r.name}</div>
          <div className="truncate font-mono text-xs text-muted-foreground">{r.slug}</div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'قیمت',
      cell: (r) => (
        <span className="font-semibold text-navy-800">{formatMoney(r.price, r.currency)}</span>
      ),
    },
    {
      key: 'stock',
      header: 'وضعیت',
      cell: (r) => (
        <span
          className={
            r.inStock
              ? 'inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700'
              : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
          }
        >
          {r.inStock ? 'فعال' : 'غیرفعال'}
        </span>
      ),
    },
    {
      key: 'inventory',
      header: 'موجودی',
      cell: (r) => (r.inStock ? 'موجود' : 'ناموجود'),
    },
    { key: 'created', header: 'ایجاد شده', cell: (r) => formatDate(r.createdAt) },
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
    <div className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-800">محصولات من</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت محصولات فروشگاه شما — افزودن، ویرایش و حذف
          </p>
        </div>
        <Link href={`${base}/new`}>
          <Button size="sm" variant="primary">
            <Plus className="h-4 w-4" />
            افزودن محصول
          </Button>
        </Link>
      </header>

      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchForm placeholder="جستجو در محصولات…" />
          {result.source === 'mock' && (
            <span className="text-xs text-muted-foreground">(داده‌های نمایشی)</span>
          )}
        </div>

        {result.total === 0 ? (
          <EmptyState
            title="محصولی یافت نشد"
            description="با افزودن محصول جدید شروع کنید."
          />
        ) : (
          <DataTable columns={columns} rows={result.items} rowKey={(r) => r.id} />
        )}

        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} />
      </Card>
    </div>
  );
}
