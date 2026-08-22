'use client';

import * as React from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function SellerApplicationActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState('');

  async function review(action: 'approve' | 'reject') {
    if (action === 'reject' && !reason.trim()) {
      toast.error('دلیل رد را وارد کنید');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/seller-applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, ...(action === 'reject' ? { rejectionReason: reason.trim() } : {}) }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: { message?: string } } | null;
      if (!response.ok || !data?.ok) {
        toast.error(data?.error?.message ?? 'عملیات انجام نشد');
        return;
      }
      toast.success(action === 'approve' ? 'درخواست فروشندگی تأیید شد' : 'درخواست فروشندگی رد شد');
      router.refresh();
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-w-[230px] flex-col gap-2">
      {rejecting ? (
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3} placeholder="دلیل رد درخواست…" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => review('approve')} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          تأیید و فعال‌سازی
        </button>
        <button type="button" disabled={busy} onClick={() => { setRejecting((value) => !value); if (rejecting) setReason(''); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-600/30 bg-red-500/10 px-3 text-xs font-bold text-red-700 hover:bg-red-500/15 disabled:opacity-50">
          <X className="h-3.5 w-3.5" />
          {rejecting ? 'لغو رد' : 'رد درخواست'}
        </button>
        {rejecting ? <button type="button" disabled={busy} onClick={() => review('reject')} className="h-9 rounded-lg border border-red-600/30 px-3 text-xs font-bold text-red-700 disabled:opacity-50">ثبت رد</button> : null}
      </div>
    </div>
  );
}
