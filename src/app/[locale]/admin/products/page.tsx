import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/features/admin/components/data-table';
import { SearchForm } from '@/features/admin/components/search-form';
import { Pagination } from '@/features/admin/components/pagination';
import {
  AddButton,
  DeleteIconButton,
  EditIconButton,
} from '@/features/admin/components/action-buttons';
import { listAdminProducts } from '@/features/admin/lib/queries';
import type { AdminProductRow } from '@/features/admin/lib/mock-data';
import { formatDate, formatMoney } from '@/features/admin/lib/format';
import { EmptyState } from '@/features/admin/components/empty-state';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(sp.pageSize ?? '10', 10) || 10));
  const result = await listAdminProducts({ q: sp.q, page, pageSize });

  const columns: Column<AdminProductRow>[] = [
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
    { key: 'category', header: 'دسته', cell: (r) => r.categoryName },
    { key: 'region', header: 'منطقه', cell: (r) => r.region },
    {
      key: 'price',
      header: 'قیمت',
      cell: (r) => (
        <span className="font-semibold text-navy-800">{formatMoney(r.price, r.currency)}</span>
      ),
    },
    {
      key: 'stock',
      header: 'موجودی',
      cell: (r) => (
        <span
          className={
            r.inStock
              ? 'inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700'
              : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
          }
        >
          {r.inStock ? 'موجود' : 'ناموجود'}
        </span>
      ),
    },
    { key: 'created', header: 'ایجاد شده', cell: (r) => formatDate(r.createdAt) },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      className: 'text-end',
      cell: (r) => (
        <div className="flex items-center justify-end gap-2">
          <EditIconButton />
          <DeleteIconButton
            endpoint={`/api/admin/products/${r.id}`}
            confirmMessage={`محصول «${r.name}» حذف شود؟`}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-800">محصولات</h2>
          <p className="mt-1 text-sm text-muted-foreground">مدیریت، ایجاد و حذف محصولات</p>
        </div>
        <AddButton label="افزودن محصول" />
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
            description="با تغییر جستجو یا افزودن محصول جدید دوباره تلاش کنید."
          />
        ) : (
          <DataTable columns={columns} rows={result.items} rowKey={(r) => r.id} />
        )}

        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} />
      </Card>
    </div>
  );
}
