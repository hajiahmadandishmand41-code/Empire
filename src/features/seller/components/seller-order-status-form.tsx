'use client';

/**
 * SellerOrderStatusForm — Phase 4.
 *
 * Compact controller shown inside the "وضعیت" card of the order detail
 * page. Sellers can advance an order between confirmed → processing →
 * shipped. Terminal states (delivered/cancelled) remain admin-only so
 * Phase 1 payments and Phase 3 shipping settlement stay authoritative.
 */
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/features/orders/components/status-badge';
import type { OrderStatus } from '@/types';

type AllowedStatus = 'confirmed' | 'processing' | 'shipped';
const ALLOWED: AllowedStatus[] = ['confirmed', 'processing', 'shipped'];
const LABEL: Record<AllowedStatus, string> = {
  confirmed: 'تأیید شد',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شد',
};

interface Props {
  orderId: string;
  status: OrderStatus;
}

export function SellerOrderStatusForm({ orderId, status }: Props) {
  const router = useRouter();
  const [current, setCurrent] = React.useState<OrderStatus>(status);
  const [next, setNext] = React.useState<AllowedStatus>(() => {
    if (status === 'pending' || status === 'confirmed') return 'processing';
    if (status === 'processing') return 'shipped';
    return 'processing';
  });
  const [busy, setBusy] = React.useState(false);
  const closed = current === 'delivered' || current === 'cancelled';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (closed) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/seller/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        toast.error(body?.error?.message ?? 'به‌روزرسانی ناموفق');
      } else {
        setCurrent(next);
        toast.success('وضعیت به‌روزرسانی شد');
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <OrderStatusBadge status={current} />
      {closed ? (
        <p className="text-xs text-muted-foreground">
          این سفارش بسته شده و توسط فروشنده قابل تغییر نیست.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
          <select
            value={next}
            onChange={(e) => setNext(e.target.value as AllowedStatus)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            disabled={busy}
          >
            {ALLOWED.map((s) => (
              <option key={s} value={s}>
                {LABEL[s]}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="primary" disabled={busy || next === current}>
            {busy ? 'در حال ذخیره…' : 'اعمال وضعیت'}
          </Button>
        </form>
      )}
      <p className="text-[11px] text-muted-foreground">
        وضعیت‌های «تحویل شده» و «لغو شده» توسط پنل مدیریت مدیریت می‌شوند.
      </p>
    </div>
  );
}
