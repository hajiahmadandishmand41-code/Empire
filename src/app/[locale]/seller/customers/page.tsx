import { Users } from 'lucide-react';
import { requireSeller } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';
import { Container } from '@/components/layout/container';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SellerCustomersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const seller = await requireSeller({ locale });
  const orders = await prisma.order.findMany({ where: { items: { some: { product: { sellerId: seller.id } } } }, select: { userId: true, shippingPhone: true, shippingFullName: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 500 });
  const customers = new Map<string, { name: string; phone: string; lastOrder: Date; orders: number }>();
  for (const order of orders) {
    const key = order.userId ?? `guest:${order.shippingPhone ?? order.shippingFullName ?? order.createdAt.toISOString()}`;
    const existing = customers.get(key);
    if (existing) existing.orders += 1;
    else customers.set(key, { name: order.shippingFullName ?? 'مشتری', phone: order.shippingPhone ?? '—', lastOrder: order.createdAt, orders: 1 });
  }
  const rows = [...customers.values()].sort((a, b) => b.lastOrder.getTime() - a.lastOrder.getTime());
  return <Container size="xl" className="space-y-6 py-2"><header><h1 className="text-2xl font-black">مشتریان</h1><p className="mt-1 text-sm text-muted-foreground">فقط مشتریانی که در سفارش‌های محصولات همین فروشنده حضور داشته‌اند نمایش داده می‌شوند.</p></header><div className="rounded-2xl border border-border bg-card p-4"><div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-sm font-bold">{rows.length} مشتری</p><p className="text-xs text-muted-foreground">بر اساس سفارش‌های واقعی</p></div></div>{rows.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">هنوز سفارشی برای محصولات شما ثبت نشده است.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="px-3 py-3 text-start">مشتری</th><th className="px-3 py-3 text-start">تلفن</th><th className="px-3 py-3 text-start">تعداد سفارش</th><th className="px-3 py-3 text-start">آخرین سفارش</th></tr></thead><tbody>{rows.map((customer, index) => <tr key={`${customer.phone}-${index}`} className="border-b border-border/60 last:border-b-0"><td className="px-3 py-3 font-semibold">{customer.name}</td><td className="px-3 py-3" dir="ltr">{customer.phone}</td><td className="px-3 py-3">{customer.orders}</td><td className="px-3 py-3 text-muted-foreground">{customer.lastOrder.toLocaleDateString('fa-AF')}</td></tr>)}</tbody></table></div>}</div><Link href={`/${locale}/seller/orders`} className="inline-flex rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold hover:bg-muted">مشاهده سفارش‌ها</Link></Container>;
}
