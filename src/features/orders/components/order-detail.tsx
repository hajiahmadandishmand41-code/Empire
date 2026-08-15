import { Card } from '@/components/ui/card';
import type { Order } from '@/types';
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  formatDateTime,
  formatMoney,
} from './status-badge';

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cod: 'پرداخت درب منزل',
  bank_transfer: 'انتقال بانکی',
  whatsapp: 'هماهنگی از طریق واتس‌اپ',
  atoma_pay: 'آتوما پی',
};

interface Props {
  order: Order;
  totals: { subtotal: number; shipping: number; total: number };
  actions?: React.ReactNode;
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasis ? 'text-base font-semibold text-navy-800' : ''}>{value}</span>
    </div>
  );
}

export function OrderDetail({ order, totals, actions }: Props) {
  const { address } = order;
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-lg font-semibold text-navy-800" dir="ltr">
          {order.reference}
        </h1>
        <OrderStatusBadge status={order.status} />
        {order.paymentStatus ? <PaymentStatusBadge status={order.paymentStatus} /> : null}
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">اقلام سفارش</h2>
          <ul className="divide-y divide-border">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.quantity.toLocaleString('fa-IR')} × {formatMoney(item.price, order.summary.currency)}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-navy-800">
                  {formatMoney(item.price * item.quantity, order.summary.currency)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <Row label="جمع اقلام" value={formatMoney(totals.subtotal, order.summary.currency)} />
            <Row label="حمل و نقل" value={formatMoney(totals.shipping, order.summary.currency)} />
            <Row label="مجموع" value={formatMoney(totals.total, order.summary.currency)} emphasis />
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">وضعیت</h2>
            {actions ?? <OrderStatusBadge status={order.status} />}
            <p className="mt-3 text-xs text-muted-foreground">
              ثبت: {formatDateTime(order.createdAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              روش پرداخت: {PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">آدرس ارسال</h2>
            <div className="space-y-1 text-sm">
              <div className="font-medium text-foreground">{address.fullName}</div>
              <div dir="ltr">{address.phone}</div>
              <div>{address.province} — {address.district}</div>
              <div className="text-muted-foreground">{address.addressLine}</div>
              {address.postalCode ? (
                <div className="text-xs text-muted-foreground">کد پستی: {address.postalCode}</div>
              ) : null}
              {address.notes ? (
                <div className="text-xs text-muted-foreground">یادداشت: {address.notes}</div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
