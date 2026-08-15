'use client';

import * as React from 'react';
import { toast } from 'sonner';

interface Props {
  payoutId: string;
  status: string;
}

async function callDecision(payoutId: string, decision: 'approved' | 'paid' | 'rejected') {
  const note = decision === 'rejected' ? window.prompt('دلیل رد درخواست (اختیاری):') ?? undefined : undefined;
  const res = await fetch(`/api/admin/payouts/${payoutId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, adminNote: note }),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json?.error?.message || 'به‌روزرسانی ناموفق بود.');
}

export function PayoutActions({ payoutId, status }: Props) {
  const [busy, setBusy] = React.useState(false);

  async function handle(decision: 'approved' | 'paid' | 'rejected') {
    setBusy(true);
    try {
      await callDecision(payoutId, decision);
      toast.success('وضعیت به‌روزرسانی شد.');
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطای غیرمنتظره');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'paid' || status === 'rejected') {
    return <span className="text-xs text-muted-foreground">نهایی شده</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'pending' ? (
        <button
          onClick={() => handle('approved')}
          disabled={busy}
          className="rounded-md border border-blue-500 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
        >
          تایید
        </button>
      ) : null}
      <button
        onClick={() => handle('paid')}
        disabled={busy}
        className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        علامت‌گذاری به‌عنوان پرداخت‌شده
      </button>
      <button
        onClick={() => handle('rejected')}
        disabled={busy}
        className="rounded-md border border-red-500 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        رد
      </button>
    </div>
  );
}
