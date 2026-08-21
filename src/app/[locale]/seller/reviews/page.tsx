import { Search, Star } from 'lucide-react';
import { requireSeller } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';
import { Container } from '@/components/layout/container';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string; status?: string; rating?: string }>;
}

export default async function SellerReviewsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const seller = await requireSeller({ locale });
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const pageSize = 20;
  const q = sp.q?.trim() ?? '';
  const status = sp.status === 'pending' ? false : sp.status === 'approved' ? true : undefined;
  const rating = Math.min(5, Math.max(1, parseInt(sp.rating ?? '', 10) || 0));
  const productFilter = {
    sellerId: seller.id,
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
  };
  const where = {
    product: productFilter,
    ...(status === undefined ? {} : { isApproved: status }),
    ...(rating ? { rating } : {}),
  };

  const [count, approvedCount, pendingCount, aggregate, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.count({ where: { product: { sellerId: seller.id }, isApproved: true } }),
    prisma.review.count({ where: { product: { sellerId: seller.id }, isApproved: false } }),
    prisma.review.aggregate({ where: { product: { sellerId: seller.id }, isApproved: true }, _avg: { rating: true } }),
    prisma.review.findMany({
      where,
      select: {
        id: true, rating: true, title: true, comment: true, isApproved: true, createdAt: true,
        product: { select: { id: true, name: true } },
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const average = Number((aggregate._avg.rating ?? 0).toFixed(1));
  return (
    <Container size="xl" className="space-y-6 py-2">
      <header><h1 className="text-2xl font-black">نظرات مشتریان</h1><p className="mt-1 text-sm text-muted-foreground">بازخوردهای محصولات خودتان را سریع بررسی و تفکیک کنید.</p></header>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">کل نظرات</p><p className="mt-1 text-2xl font-black">{(approvedCount + pendingCount).toLocaleString('fa-IR')}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">میانگین تأییدشده</p><p className="mt-1 flex items-center gap-1 text-2xl font-black">{average.toFixed(1)} <Star className="h-5 w-5 fill-amber-400 text-amber-400" /></p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">تأییدشده</p><p className="mt-1 text-2xl font-black">{approvedCount.toLocaleString('fa-IR')}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">در انتظار تأیید</p><p className="mt-1 text-2xl font-black">{pendingCount.toLocaleString('fa-IR')}</p></div>
      </div>
      <form className="grid gap-2 sm:grid-cols-[1fr_160px_150px_auto]" method="get">
        <div className="relative"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input name="q" defaultValue={q} placeholder="جست‌وجوی نام محصول..." className="h-10 w-full rounded-xl border border-border bg-card ps-9 pe-3 text-sm outline-none focus:border-primary" /></div>
        <select name="status" defaultValue={sp.status ?? ''} className="h-10 rounded-xl border border-border bg-card px-3 text-sm"><option value="">همه وضعیت‌ها</option><option value="approved">تأییدشده</option><option value="pending">در انتظار</option></select>
        <select name="rating" defaultValue={rating ? String(rating) : ''} className="h-10 rounded-xl border border-border bg-card px-3 text-sm"><option value="">همه امتیازها</option>{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value} ستاره</option>)}</select>
        <button className="h-10 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">فیلتر</button>
      </form>
      {reviews.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">نظری مطابق فیلترهای شما پیدا نشد.</div> : <div className="space-y-3">{reviews.map((review) => <article key={review.id} className="rounded-2xl border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={`/${locale}/seller/products/${review.product.id}/edit`} className="text-sm font-bold hover:text-primary">{review.product.name}</Link><p className="mt-1 text-xs text-muted-foreground">{review.user.fullName}</p></div><div className="flex items-center gap-2"><div className="flex items-center gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />)}</div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${review.isApproved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'}`}>{review.isApproved ? 'تأییدشده' : 'در انتظار'}</span></div></div>{review.title && <h2 className="mt-3 text-sm font-bold">{review.title}</h2>}{review.comment && <p className="mt-2 text-sm leading-7 text-muted-foreground">{review.comment}</p>}</article>)}</div>}
      {totalPages > 1 && <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"><span className="text-muted-foreground">صفحه {page} از {totalPages}</span><div className="flex gap-2">{page > 1 && <Link href={`?q=${encodeURIComponent(q)}&status=${sp.status ?? ''}&rating=${rating || ''}&page=${page - 1}`} className="rounded-lg border border-border px-3 py-1.5">قبلی</Link>}{page < totalPages && <Link href={`?q=${encodeURIComponent(q)}&status=${sp.status ?? ''}&rating=${rating || ''}&page=${page + 1}`} className="rounded-lg border border-border px-3 py-1.5">بعدی</Link>}</div></div>}
    </Container>
  );
}
