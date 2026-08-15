import { Badge } from '@/components/ui/badge';
import type { OrderStatus, PaymentStatus } from '@/types';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'در انتظار پرداخت',
  confirmed: 'تایید شده',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  cancelled: 'لغو شده',
};

const VARIANT: Record<OrderStatus, 'gold' | 'default' | 'destructive' | 'secondary'> = {
  pending: 'secondary',
  confirmed: 'gold',
  processing: 'gold',
  shipped: 'gold',
  delivered: 'default',
  cancelled: 'destructive',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANT[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'در انتظار',
  paid: 'پرداخت شده',
  failed: 'ناموفق',
  refunded: 'مسترد شده',
  cancelled: 'لغو شده',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const variant = status === 'paid' ? 'default' : status === 'failed' ? 'destructive' : 'secondary';
  return <Badge variant={variant}>{PAYMENT_STATUS_LABEL[status]}</Badge>;
}

export function formatMoney(amount: number, currency: string) {
  return `${amount.toLocaleString('fa-IR')} ${currency}`;
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fa-IR');
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('fa-IR');
  } catch {
    return iso;
  }
}
