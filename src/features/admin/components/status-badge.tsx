import * as React from 'react';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700',
  confirmed: 'bg-sky-500/15 text-sky-700',
  processing: 'bg-indigo-500/15 text-indigo-700',
  shipped: 'bg-purple-500/15 text-purple-700',
  delivered: 'bg-emerald-500/15 text-emerald-700',
  cancelled: 'bg-red-500/15 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'در انتظار',
  confirmed: 'تأیید شده',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  cancelled: 'لغو شده',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export function statusLabel(status: string) {
  return STATUS_LABEL[status] ?? status;
}
