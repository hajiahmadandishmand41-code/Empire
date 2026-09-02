import Link from 'next/link';
import { Search, Users } from 'lucide-react';
import { requireSeller } from '@/lib/auth/roles';
import { Container } from '@/components/layout/container';
import { listSellerCustomers } from '@/features/seller/lib/customer-queries';
import { formatDate } from '@/features/orders';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function SellerCustomersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const seller = await requireSeller({ locale });
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  const q = sp.q?.trim() ?? '';
  const result = await listSellerCustomers({ sellerId: seller.id, page, pageSize: 20, q });
  const totalPages = Math.max(1, Math.ceil(result.totalCustomers / result.pageSize));

  return (
    <Container size="xl" className="space-y-6 py-2">
      <header>
        <h1 className="text-2xl font-black">مدیریت مشتریان</h1>
        <p className="mt-1 text-sm text-muted-foreground">مشتریانی که در سفارش‌های محصولات همین فروشنده خرید داشته‌اند.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">کل مشتریان</p><p className="mt-1 text-2xl font-black">{result.totalCustomers.toLocaleString('fa-AF')}</p></div></div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">نمایش فعلی</p><p className="mt-1 text-2xl font-black">{result.rows.length.toLocaleString('fa-AF')}</p></div>
      </div>

      <form className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row" method="get">
        <div className="relative flex-1"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input name="q" defaultValue={q} placeholder="جست‌وجوی نام یا شماره تلفن…" className="h-10 w-full rounded-xl border border-border bg-background ps-10 pe-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" /></div>
        <button className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90" type="submit">جست‌وجو</button>
        {q ? <Link href={`/${locale}/seller/customers`} className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted">پاک کردن</Link> : null}
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {result.rows.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">مشتری مطابق جست‌وجوی شما پیدا نشد.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground"><tr><th className="px-4 py-3 text-start">مشتری</th><th className="px-4 py-3 text-start">تلفن</th><th className="px-4 py-3 text-start">تعداد سفارش</th><th className="px-4 py-3 text-start">آخرین سفارش</th><th className="px-4 py-3 text-start" /></tr></thead><tbody>{result.rows.map((customer) => <tr key={customer.key} className="border-b border-border/60 last:border-b-0 hover:bg-muted/20"><td className="px-4 py-3 font-semibold">{customer.name}</td><td className="px-4 py-3" dir="ltr">{customer.phone}</td><td className="px-4 py-3 font-bold">{customer.orders.toLocaleString('fa-AF')}</td><td className="px-4 py-3 text-muted-foreground">{formatDate(customer.lastOrder)}</td><td className="px-4 py-3 text-end"><Link href={`/${locale}/seller/orders?q=${encodeURIComponent(customer.phone === '—' ? customer.name : customer.phone)}`} className="text-xs font-bold text-primary hover:underline">سفارش‌ها</Link></td></tr>)}</tbody></table></div>}
      </div>

      {totalPages > 1 ? <div className="flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">صفحه {page.toLocaleString('fa-AF')} از {totalPages.toLocaleString('fa-AF')}</span><div className="flex gap-2">{page > 1 ? <Link href={`?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className="rounded-xl border border-border px-4 py-2 font-medium hover:bg-muted">قبلی</Link> : null}{page < totalPages ? <Link href={`?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className="rounded-xl border border-border px-4 py-2 font-medium hover:bg-muted">بعدی</Link> : null}</div></div> : null}
    </Container>
  );
}
