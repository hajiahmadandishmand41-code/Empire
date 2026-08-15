import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { requireAuth } from '@/lib/auth/roles';
import { listUserOrders, OrderList } from '@/features/orders';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function OrdersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const user = await requireAuth({ locale });

  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const result = await listUserOrders({
    userId: user.id,
    page,
    pageSize: 10,
    status: sp.status,
  });

  return (
    <Container size="lg" className="py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-800">سفارش‌های من</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            پیگیری وضعیت و تاریخچه سفارش‌های شما
          </p>
        </div>
        <Link
          href={`/${locale}/shop`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ادامه خرید
        </Link>
      </div>

      <OrderList
        orders={result.items}
        hrefBase={`/${locale}/orders`}
        emptyTitle="هنوز سفارشی ندارید"
        emptyDescription="پس از ثبت اولین سفارش، اینجا می‌توانید آن را پیگیری کنید."
      />
    </Container>
  );
}
