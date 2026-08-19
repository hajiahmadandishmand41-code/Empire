'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ORDER_STATUSES } from './status-badge';

interface OrderStatusSelectProps { orderId: string; current: string }
export function OrderStatusSelect({ orderId, current }: OrderStatusSelectProps) {
  const router = useRouter(); const t = useTranslations('admin.orderStatus');
  const [value, setValue] = React.useState(current); const [busy, setBusy] = React.useState(false);
  async function onChange(next: string) { if (next === value) return; setBusy(true); const prev = value; setValue(next); try { const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: next }) }); const body = await res.json().catch(() => null); if (!res.ok || !body?.ok) { setValue(prev); toast.error(body?.error?.message ?? t('updateFailed')); } else { toast.success(t('updated')); router.refresh(); } } catch { setValue(prev); toast.error(t('network')); } finally { setBusy(false); } }
  return <select value={value} disabled={busy} onChange={(e) => onChange(e.target.value)} aria-label={t('selectAria')} className="h-8 rounded-md border border-border bg-background px-2 text-xs disabled:opacity-50">{ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(s)}</option>)}</select>;
}
