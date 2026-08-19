import { BadgePercent } from 'lucide-react';
import { requireSeller } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';
import { Container } from '@/components/layout/container';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SellerDiscountsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const seller = await requireSeller({ locale });
  const products = await prisma.product.findMany({ where: { sellerId: seller.id, compareAtPrice: { not: null } }, include: { category: true }, orderBy: { updatedAt: 'desc' } });
  return <Container size="xl" className="space-y-6 py-2"><header><h1 className="text-2xl font-black">تخفیف‌ها</h1><p className="mt-1 text-sm text-muted-foreground">محصولات دارای قیمت قبلی و پیشنهاد فروش ویژه را مدیریت کنید.</p></header>{products.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center"><BadgePercent className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" /><p className="text-sm font-semibold">هنوز محصول تخفیف‌دار ندارید.</p><Link href={`/${locale}/seller/products/new`} className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">افزودن محصول</Link></div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => { const oldPrice = product.compareAtPrice ? Number(product.compareAtPrice) : 0; const price = Number(product.price); const pct = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0; return <article key={product.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="line-clamp-2 text-sm font-bold">{product.name}</p><p className="mt-1 text-xs text-muted-foreground">{product.category.name}</p></div>{pct > 0 && <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[10px] font-black text-red-700 dark:bg-red-950/30 dark:text-red-300">-{pct}٪</span>}</div><div className="mt-4 flex items-end gap-2"><span className="text-lg font-black text-price-current">{formatPrice(price, 'AFN', locale)}</span><span className="text-xs text-muted-foreground line-through">{formatPrice(oldPrice, 'AFN', locale)}</span></div><Link href={`/${locale}/seller/products/${product.id}/edit`} className="mt-4 inline-flex rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted">ویرایش محصول</Link></article>; })}</div>}</Container>;
}
