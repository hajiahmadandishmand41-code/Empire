import { PackageCheck, AlertTriangle } from 'lucide-react';
import { requireSeller } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';
import { Container } from '@/components/layout/container';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SellerInventoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const seller = await requireSeller({ locale });
  const products = await prisma.product.findMany({ where: { sellerId: seller.id }, include: { category: true }, orderBy: [{ stockQuantity: 'asc' }, { updatedAt: 'desc' }] });
  const lowStock = products.filter((product) => product.isActive && product.stockQuantity > 0 && product.stockQuantity <= 5).length;
  const outOfStock = products.filter((product) => product.stockQuantity <= 0).length;
  return <Container size="xl" className="space-y-6 py-2"><header><h1 className="text-2xl font-black">مدیریت موجودی</h1><p className="mt-1 text-sm text-muted-foreground">موجودی محصولات خود را از Database به‌صورت واقعی مدیریت و پیگیری کنید.</p></header><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">کل محصولات</p><p className="mt-1 text-2xl font-black">{products.length}</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20"><p className="text-xs text-amber-700 dark:text-amber-300">موجودی کم</p><p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">{lowStock}</p></div><div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20"><p className="text-xs text-red-700 dark:text-red-300">ناموجود</p><p className="mt-1 text-2xl font-black text-red-700 dark:text-red-300">{outOfStock}</p></div></div><div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="grid grid-cols-[1fr_130px_120px_110px] gap-3 border-b border-border px-4 py-3 text-xs font-bold text-muted-foreground"><span>محصول</span><span>دسته</span><span>موجودی</span><span>قیمت</span></div>{products.map((product) => <div key={product.id} className="grid grid-cols-[1fr_130px_120px_110px] items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0"><div className="min-w-0"><Link href={`/${locale}/seller/products/${product.id}/edit`} className="block truncate text-sm font-semibold hover:text-primary">{product.name}</Link>{product.stockQuantity <= 5 && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600"><AlertTriangle className="h-3 w-3" />نیازمند بررسی</span>}</div><span className="truncate text-xs text-muted-foreground">{product.category.name}</span><span className="inline-flex items-center gap-1 text-sm font-bold">{product.stockQuantity <= 0 ? <span className="text-red-600">ناموجود</span> : <><PackageCheck className="h-4 w-4 text-emerald-500" />{product.stockQuantity}</>}</span><span className="text-sm font-bold">{formatPrice(Number(product.price), 'AFN', locale)}</span></div>)}</div></Container>;
}
