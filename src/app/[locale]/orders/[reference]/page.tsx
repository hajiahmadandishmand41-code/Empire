import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { requireAuth } from '@/lib/auth/roles';
import { getOrderForViewer, OrderDetail } from '@/features/orders';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; reference: string }>;
}

export default async function CustomerOrderDetailPage({ params }: Props) {
  const { locale, reference } = await params;
  const user = await requireAuth({ locale });

  const detail = await getOrderForViewer(reference, {
    id: user.id,
    role: user.role,
  });
  if (!detail) notFound();

  return (
    <Container size="lg" className="py-10">
      <Link
        href={`/${locale}/orders`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        بازگشت به سفارش‌ها
      </Link>
      <OrderDetail order={detail.order} totals={detail.totals} />
    </Container>
  );
}
