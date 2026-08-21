import { BadgePercent, Search } from 'lucide-react';
import { requireSeller } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';
import { Container } from '@/components/layout/container';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}

export default async function SellerDiscountsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const seller = await requireSeller({ locale });
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const pageSize = 24;
  const q = sp.q?.trim() ?? '';
  const where = {
    sellerId: seller.id,
    compareAtPrice: { not: null },
    ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { slug: { contains: q, mode: 'insensitive' as const } }] } : {}),
  };
  const [count, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: { id: true, name: true, price: true, compareAtPrice: true, currency: true, category: { select: { name: true } } },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const safePage = Math.min(page, totalPages);
  return (
    <Container size="xl" className="space-y-6 py-2">
      <header><h1 className="text-2xl font-black">تخفیف‌ها</h1><p className="mt-1 text-sm text-muted-foreground">محصولات تخفیف‌دار را سریع پیدا و مدیریت کنید.</p></header>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">تعداد تخفیف‌ها</p><p className="mt-1 text-2xl font-black">{count.toLocaleString('fa-IR')}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">در هر صفحه</p><p className="mt-1 text-2xl font-black">{pageSize}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">صفحه</p><p className="mt-1 text-2xl font-black">{safePage} / {totalPages}</p></div>
      </div>
      <form className="flex flex-col gap-2 sm:flex-row" method="get">
        <div className="relative flex-1"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input name="q" defaultValue={q} placeholder="نام یا slug محصول..." className="h-10 w-full rounded-xl border border-border bg-card ps-9 pe-3 text-sm outline-none focus:border-primary" /></div>
        <button className="h-10 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">جست‌وجو</button>
      </form>
      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center"><BadgePercent className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" /><p className="text-sm font-semibold">محصول تخفیف‌داری مطابق جست‌وجوی شما پیدا نشد.</p><Link href={`/${locale}/seller/products/new`} className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">افزودن محصول</Link></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => { const oldPrice = product.compareAtPrice ? Number(product.compareAtPrice) : 0; const price = Number(product.price); const pct = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0; return <article key={product.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="line-clamp-2 text-sm font-bold">{product.name}</p><p className="mt-1 text-xs text-muted-foreground">{product.category.name}</p></div>{pct > 0 && <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[10px] font-black text-red-700 dark:bg-red-950/30 dark:text-red-300">-{pct}٪</span>}</div><div className="mt-4 flex items-end gap-2"><span className="text-lg font-black text-price-current">{formatPrice(price, product.currency, locale)}</span><span className="text-xs text-muted-foreground line-through">{formatPrice(oldPrice, product.currency, locale)}</span></div><Link href={`/${locale}/seller/products/${product.id}/edit`} className="mt-4 inline-flex rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted">ویرایش محصول</Link></article>; })}</div>
      )}
      {safePage > 1 || safePage < totalPages ? <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"><span className="text-muted-foreground">صفحه {safePage} از {totalPages}</span><div className="flex gap-2">{safePage > 1 && <Link href={`?q=${encodeURIComponent(q)}&page=${safePage - 1}`} className="rounded-lg border border-border px-3 py-1.5">قبلی</Link>}{safePage < totalPages && <Link href={`?q=${encodeURIComponent(q)}&page=${safePage + 1}`} className="rounded-lg border border-border px-3 py-1.5">بعدی</Link>}</div></div> : null}
    </Container>
  );
}
