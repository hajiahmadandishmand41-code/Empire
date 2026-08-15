'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { SellerStatus } from '@/features/admin/lib/mock-data';

interface Props {
  sellerId: string;
  status: SellerStatus;
  isActive: boolean;
}

const LABELS: Record<SellerStatus, string> = {
  none: 'ثبت‌نشده',
  pending: 'در انتظار',
  approved: 'تایید شده',
  rejected: 'رد شده',
};

const BADGE: Record<SellerStatus, string> = {
  none: 'bg-muted text-muted-foreground',
  pending: 'bg-amber-500/15 text-amber-700',
  approved: 'bg-emerald-500/15 text-emerald-700',
  rejected: 'bg-red-500/15 text-red-700',
};

export function SellerStatusBadge({ status }: { status: SellerStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[status]}`}>
      {LABELS[status]}
    </span>
  );
}

export function SellerActions({ sellerId, status, isActive }: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function call(body: Record<string, unknown>, successMsg: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error?.message ?? 'خطا');
        return;
      }
      toast.success(successMsg);
      router.refresh();
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SellerStatusBadge status={status} />
      {status !== 'approved' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => call({ action: 'approve' }, 'فروشنده تایید شد')}
          className="inline-flex h-8 items-center rounded-md border border-emerald-600/40 bg-emerald-500/10 px-2 text-xs font-medium text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50"
        >
          تایید
        </button>
      )}
      {status !== 'rejected' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => call({ action: 'reject' }, 'فروشنده رد شد')}
          className="inline-flex h-8 items-center rounded-md border border-red-600/40 bg-red-500/10 px-2 text-xs font-medium text-red-700 hover:bg-red-500/20 disabled:opacity-50"
        >
          رد
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => call({ isActive: !isActive }, isActive ? 'حساب غیرفعال شد' : 'حساب فعال شد')}
        className={
          'inline-flex h-8 items-center rounded-md border px-2 text-xs disabled:opacity-50 ' +
          (isActive
            ? 'border-border bg-muted text-muted-foreground hover:bg-muted/70'
            : 'border-emerald-600/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20')
        }
      >
        {isActive ? 'غیرفعال کن' : 'فعال کن'}
      </button>
    </div>
  );
}
