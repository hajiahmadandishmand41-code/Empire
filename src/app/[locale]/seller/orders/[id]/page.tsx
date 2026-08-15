import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { requireSeller } from '@/lib/auth/roles';
import { getOrderForViewer, OrderDetail } from '@/features/orders';
import { SellerOrderStatusForm } from '@/features/seller/components/seller-order-status-form';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function SellerOrderDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const user = await requireSeller({ locale });

  const detail = await getOrderForViewer(id, { id: user.id, role: user.role });
  if (!detail) notFound();

  return (
    <div className="space-y-4">
      <Link
        href={`/${locale}/seller/orders`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        بازگشت به سفارش‌ها
      </Link>
      <OrderDetail
        order={detail.order}
        totals={detail.totals}
        actions={
          <SellerOrderStatusForm
            orderId={detail.order.id ?? detail.order.reference}
            status={detail.order.status}
          />
        }
      />
    </div>
  );
}
