import { Star } from 'lucide-react';
import { requireSeller } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';
import { Container } from '@/components/layout/container';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SellerReviewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const seller = await requireSeller({ locale });
  const reviews = await prisma.review.findMany({ where: { product: { sellerId: seller.id } }, include: { product: { select: { id: true, name: true, slug: true } }, user: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  return <Container size="xl" className="space-y-6 py-2"><header><h1 className="text-2xl font-black">نظرات مشتریان</h1><p className="mt-1 text-sm text-muted-foreground">بازخوردهای ثبت‌شده روی محصولات خودتان را ببینید.</p></header><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">تعداد نظرات</p><p className="mt-1 text-2xl font-black">{reviews.length}</p></div><div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">میانگین امتیاز</p><p className="mt-1 flex items-center gap-1 text-2xl font-black">{average.toFixed(1)} <Star className="h-5 w-5 fill-amber-400 text-amber-400" /></p></div><div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">نظرات تأییدشده</p><p className="mt-1 text-2xl font-black">{reviews.filter((r) => r.isApproved).length}</p></div></div>{reviews.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">هنوز نظری برای محصولات شما ثبت نشده است.</div> : <div className="space-y-3">{reviews.map((review) => <article key={review.id} className="rounded-2xl border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={`/${locale}/seller/products/${review.product.id}/edit`} className="text-sm font-bold hover:text-primary">{review.product.name}</Link><p className="mt-1 text-xs text-muted-foreground">{review.user.fullName}</p></div><div className="flex items-center gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />)}</div></div>{review.title && <h2 className="mt-3 text-sm font-bold">{review.title}</h2>}{review.comment && <p className="mt-2 text-sm leading-7 text-muted-foreground">{review.comment}</p>}</article>)}</div>}</Container>;
}
