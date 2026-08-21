import { PackageCheck, AlertTriangle, Search, SlidersHorizontal } from 'lucide-react';
import { requireSeller } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';
import { Container } from '@/components/layout/container';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string; pageSize?: string }>;
}

export default async function SellerInventoryPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const seller = await requireSeller({ locale });

  const q = sp.q?.trim() ?? '';
  const status = sp.status === 'low' || sp.status === 'out' || sp.status === 'healthy' ? sp.status : 'all';
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(10, Number.parseInt(sp.pageSize ?? '25', 10) || 25));

  const baseWhere = { sellerId: seller.id };
  const filteredWhere = {
    ...baseWhere,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { slug: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(status === 'low' ? { stockQuantity: { gt: 0, lte: 5 } } : {}),
    ...(status === 'out' ? { stockQuantity: { lte: 0 } } : {}),
    ...(status === 'healthy' ? { stockQuantity: { gt: 5 } } : {}),
  };

  const [total, products, totalProducts, lowStock, outOfStock] = await Promise.all([
    prisma.product.count({ where: filteredWhere }),
    prisma.product.findMany({
      where: filteredWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        currency: true,
        stockQuantity: true,
        inStock: true,
        isActive: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
      orderBy: [{ stockQuantity: 'asc' }, { updatedAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where: baseWhere }),
    prisma.product.count({ where: { ...baseWhere, isActive: true, stockQuantity: { gt: 0, lte: 5 } } }),
    prisma.product.count({ where: { ...baseWhere, stockQuantity: { lte: 0 } } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status !== 'all') params.set('status', status);
    params.set('page', String(nextPage));
    params.set('pageSize', String(pageSize));
    return `/${locale}/seller/inventory?${params.toString()}`;
  }

  return (
    <Container size="xl" className="space-y-5 py-2">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">مدیریت موجودی</h1>
          <p className="mt-1 text-sm text-muted-foreground">موجودی را سریع پیدا کنید و از همان‌جا وارد ویرایش محصول شوید.</p>
        </div>
        <Link href={`/${locale}/seller/products`} className="text-sm font-semibold text-primary hover:underline">مدیریت محصولات ←</Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">کل محصولات</p><p className="mt-1 text-2xl font-black">{totalProducts.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20"><p className="text-xs text-amber-700 dark:text-amber-300">موجودی کم</p><p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">{lowStock.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20"><p className="text-xs text-red-700 dark:text-red-300">ناموجود</p><p className="mt-1 text-2xl font-black text-red-700 dark:text-red-300">{outOfStock.toLocaleString()}</p></div>
      </div>

      <form className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="نام یا slug محصول…" className="w-full rounded-xl border border-border bg-background py-2.5 pe-3 ps-9 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <select name="status" defaultValue={status} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20">
            <option value="all">همه</option>
            <option value="low">موجودی کم (۱ تا ۵)</option>
            <option value="out">ناموجود</option>
            <option value="healthy">موجودی مناسب</option>
          </select>
        </div>
        <input type="hidden" name="page" value="1" />
        <button type="submit" className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background hover:opacity-90">اعمال</button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-[1fr_130px_110px_110px] gap-3 border-b border-border px-4 py-3 text-xs font-bold text-muted-foreground sm:grid-cols-[1fr_150px_110px_120px_120px]">
          <span>محصول</span><span className="hidden sm:block">دسته</span><span>موجودی</span><span>وضعیت</span><span>قیمت</span>
        </div>
        {products.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">محصولی با این فیلتر پیدا نشد.</div>
        ) : products.map((product) => (
          <div key={product.id} className="grid grid-cols-[1fr_130px_110px_110px] items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_150px_110px_120px_120px]">
            <div className="min-w-0"><Link href={`/${locale}/seller/products/${product.id}/edit`} className="block truncate text-sm font-semibold hover:text-primary">{product.name}</Link><span className="block truncate text-[11px] text-muted-foreground">{product.slug}</span></div>
            <span className="hidden truncate text-xs text-muted-foreground sm:block">{product.category.name}</span>
            <span className="inline-flex items-center gap-1 text-sm font-bold">{product.stockQuantity <= 0 ? <span className="text-red-600">ناموجود</span> : <><PackageCheck className="h-4 w-4 text-emerald-500" />{product.stockQuantity.toLocaleString()}</>}</span>
            <span className={product.isActive && product.stockQuantity > 0 ? 'text-xs font-semibold text-emerald-600' : 'text-xs font-semibold text-muted-foreground'}>{product.isActive && product.stockQuantity > 0 ? 'فعال' : 'نیازمند بررسی'}</span>
            <span className="text-sm font-bold">{formatPrice(Number(product.price), product.currency ?? 'AFN', locale)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground">صفحه {currentPage.toLocaleString()} از {totalPages.toLocaleString()} — {total.toLocaleString()} مورد</span>
        <div className="flex gap-2">
          <Link aria-disabled={currentPage <= 1} className={currentPage <= 1 ? 'pointer-events-none rounded-xl border border-border px-4 py-2 text-muted-foreground/50' : 'rounded-xl border border-border px-4 py-2 hover:bg-muted'} href={pageHref(Math.max(1, currentPage - 1))}>قبلی</Link>
          <Link aria-disabled={currentPage >= totalPages} className={currentPage >= totalPages ? 'pointer-events-none rounded-xl border border-border px-4 py-2 text-muted-foreground/50' : 'rounded-xl border border-border px-4 py-2 hover:bg-muted'} href={pageHref(Math.min(totalPages, currentPage + 1))}>بعدی</Link>
        </div>
      </div>
    </Container>
  );
}
