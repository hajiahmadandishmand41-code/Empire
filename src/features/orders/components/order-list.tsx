import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback';
import { OrderStatusBadge, formatDate, formatMoney } from './status-badge';
import type { OrderListItem } from '../lib/queries';

interface Props {
  orders: OrderListItem[];
  hrefBase: string; // e.g. `/fa/orders` or `/fa/seller/orders`
  emptyTitle?: string;
  emptyDescription?: string;
}

export function OrderList({ orders, hrefBase, emptyTitle, emptyDescription }: Props) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? 'سفارشی یافت نشد'}
        description={emptyDescription ?? 'هنوز هیچ سفارشی ثبت نشده است.'}
      />
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-start text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">شماره سفارش</th>
              <th className="px-4 py-3 font-medium">تاریخ</th>
              <th className="px-4 py-3 font-medium">اقلام</th>
              <th className="px-4 py-3 font-medium">مبلغ</th>
              <th className="px-4 py-3 font-medium">وضعیت</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                  {o.reference}
                </td>
                <td className="px-4 py-3">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3">{o.itemCount.toLocaleString('fa-IR')}</td>
                <td className="px-4 py-3 font-semibold text-navy-800">
                  {formatMoney(o.total, o.currency)}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-end">
                  <Link
                    href={`${hrefBase}/${o.reference}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    جزئیات
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
