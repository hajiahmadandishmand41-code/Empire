import * as React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700', confirmed: 'bg-sky-500/15 text-sky-700', processing: 'bg-indigo-500/15 text-indigo-700', shipped: 'bg-purple-500/15 text-purple-700', delivered: 'bg-emerald-500/15 text-emerald-700', cancelled: 'bg-red-500/15 text-red-700',
};

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('admin.orderStatus');
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground')}>{t.has(status) ? t(status) : status}</span>;
}

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export function statusLabel(status: string) { return status; }
