import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/features/admin/components/status-badge';
import { OrderStatusSelect } from '@/features/admin/components/order-status-select';
import { mockOrders } from '@/features/admin/lib/mock-data';
import { mapOrder } from '@/lib/db-mappers';
import { formatDateTime, formatMoney } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const detail = await loadOrder(id);
  if (!detail) notFound();

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <Link href={`/${locale}/admin/orders`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          بازگشت به لیست
        </Link>
        <span className="text-muted-foreground">/</span>
        <h2 className="font-mono text-lg font-semibold text-navy-800">{detail.reference}</h2>
        <StatusBadge status={detail.status} />
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">اقلام سفارش</h3>
          <ul className="divide-y divide-border">
            {detail.items.map((item, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.quantity} × {formatMoney(item.price, detail.currency)}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-navy-800">
                  {formatMoney(item.price * item.quantity, detail.currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <Row label="جمع اقلام" value={formatMoney(detail.subtotal, detail.currency)} />
            <Row label="حمل و نقل" value={formatMoney(detail.shipping, detail.currency)} />
            <Row label="مجموع" value={formatMoney(detail.total, detail.currency)} emphasis />
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">وضعیت</h3>
            <OrderStatusSelect orderId={detail.id} current={detail.status} />
            <p className="mt-3 text-xs text-muted-foreground">ثبت: {formatDateTime(detail.createdAt)}</p>
            <p className="text-xs text-muted-foreground">روش پرداخت: {detail.paymentMethod}</p>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">مشتری</h3>
            <div className="space-y-1 text-sm">
              <div className="font-medium text-foreground">{detail.address.fullName}</div>
              <div>{detail.address.phone}</div>
              <div className="text-muted-foreground">{detail.address.province} — {detail.address.district}</div>
              <div className="text-muted-foreground">{detail.address.addressLine}</div>
              {detail.address.postalCode && <div className="text-muted-foreground">کدپستی: {detail.address.postalCode}</div>}
              {detail.address.notes && <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">{detail.address.notes}</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasis ? 'text-base font-bold text-navy-800' : 'font-medium'}>{value}</span>
    </div>
  );
}

interface OrderDetailView {
  id: string;
  reference: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  address: {
    fullName: string;
    phone: string;
    province: string;
    district: string;
    addressLine: string;
    postalCode?: string;
    notes?: string;
  };
}

async function loadOrder(id: string): Promise<OrderDetailView | null> {
  if (!isDatabaseConfigured()) {
    const m = mockOrders.find((o) => o.id === id || o.reference === id);
    if (!m) return null;
    return {
      id: m.id,
      reference: m.reference,
      status: m.status,
      paymentMethod: m.paymentMethod,
      createdAt: m.createdAt,
      subtotal: m.total,
      shipping: 0,
      total: m.total,
      currency: m.currency,
      items: Array.from({ length: m.itemCount }, (_, i) => ({ name: `کالای نمایشی ${i + 1}`, price: Math.round(m.total / m.itemCount), quantity: 1 })),
      address: { fullName: m.customerName, phone: '+9370000000', province: 'کابل', district: 'ناحیه ۱۰', addressLine: 'آدرس نمایشی' },
    };
  }
  try {
    const row = await prisma.order.findFirst({
      where: { OR: [{ id }, { reference: id }] },
      include: { items: true, address: true },
    });
    if (!row) return null;
    const mapped = mapOrder(row);
    return {
      id: row.id,
      reference: row.reference,
      status: row.status,
      paymentMethod: row.paymentMethod,
      createdAt: row.createdAt.toISOString(),
      subtotal: Number(row.subtotal),
      shipping: Number(row.shipping),
      total: Number(row.total),
      currency: row.currency,
      items: mapped.items.map((item) => ({ ...item, price: Number(item.price) })),
      address: mapped.address,
    };
  } catch (err) {
    console.error('[admin/orders/:id] load error:', err);
    return null;
  }
}
