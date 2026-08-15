'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ORDER_STATUSES, statusLabel } from './status-badge';

interface OrderStatusSelectProps {
  orderId: string;
  current: string;
}

export function OrderStatusSelect({ orderId, current }: OrderStatusSelectProps) {
  const router = useRouter();
  const [value, setValue] = React.useState(current);
  const [busy, setBusy] = React.useState(false);

  async function onChange(next: string) {
    if (next === value) return;
    setBusy(true);
    const prev = value;
    setValue(next);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        setValue(prev);
        toast.error(body?.error?.message ?? 'تغییر وضعیت ناموفق');
      } else {
        toast.success('وضعیت به‌روز شد');
        router.refresh();
      }
    } catch {
      setValue(prev);
      toast.error('خطای شبکه');
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      value={value}
      disabled={busy}
      onChange={(e) => onChange(e.target.value)}
      aria-label="وضعیت سفارش"
      className="h-8 rounded-md border border-border bg-background px-2 text-xs disabled:opacity-50"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {statusLabel(s)}
        </option>
      ))}
    </select>
  );
}
