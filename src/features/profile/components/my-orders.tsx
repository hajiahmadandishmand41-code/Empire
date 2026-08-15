/**
 * MyOrders — Phase 2.
 *
 * Server component. Fetches the current user's recent orders directly
 * from the DB (via `listUserOrders`) and links to the detail page.
 */
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/current-user';
import { listUserOrders, OrderStatusBadge, formatDate, formatMoney } from '@/features/orders';

interface Props {
  locale: string;
}

export async function MyOrders({ locale }: Props) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { items: orders } = await listUserOrders({
    userId: user.id,
    page: 1,
    pageSize: 5,
  });

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-navy-800">سفارش‌های اخیر</h2>
        <Link
          href={`/${locale}/orders`}
          className="text-xs font-medium text-primary hover:underline"
        >
          مشاهده همه
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">هنوز سفارشی ثبت نکرده‌اید.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-800/10 text-start text-xs text-muted-foreground">
                <th className="py-2 font-medium">شماره سفارش</th>
                <th className="py-2 font-medium">تاریخ</th>
                <th className="py-2 font-medium">مبلغ</th>
                <th className="py-2 font-medium">وضعیت</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-navy-800/5">
                  <td className="py-3 font-mono text-xs" dir="ltr">
                    {o.reference}
                  </td>
                  <td className="py-3">{formatDate(o.createdAt)}</td>
                  <td className="py-3">{formatMoney(o.total, o.currency)}</td>
                  <td className="py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="py-3 text-end">
                    <Link
                      href={`/${locale}/orders/${o.reference}`}
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
      )}
    </Card>
  );
}
