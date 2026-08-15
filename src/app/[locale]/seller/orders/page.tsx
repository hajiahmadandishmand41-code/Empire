import { requireSeller } from '@/lib/auth/roles';
import { listSellerOrders, OrderList } from '@/features/orders';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}

export default async function SellerOrdersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const user = await requireSeller({ locale });

  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const result = await listSellerOrders({
    sellerId: user.id,
    page,
    pageSize: 10,
    status: sp.status,
    q: sp.q,
  });

  return (
    <div className="space-y-4">
      <header>
        <h2 className="font-display text-2xl font-bold text-navy-800">سفارش‌های من</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          سفارش‌هایی که حاوی محصولات شما هستند
        </p>
      </header>

      <OrderList
        orders={result.items}
        hrefBase={`/${locale}/seller/orders`}
        emptyTitle="سفارشی برای محصولات شما ثبت نشده"
        emptyDescription="پس از فروش محصولات، سفارش‌ها اینجا نمایش داده می‌شوند."
      />
    </div>
  );
}
