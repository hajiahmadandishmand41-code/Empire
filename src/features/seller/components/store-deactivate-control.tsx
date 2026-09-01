'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function StoreDeactivateControl() {
  const [busy, setBusy] = React.useState(false);
  async function deactivate() {
    if (!window.confirm('فروشگاه غیرفعال شود؟ محصولات، سفارش‌ها و اطلاعات شما حذف نمی‌شوند.')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/seller/settings', { method: 'DELETE', credentials: 'include' });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) throw new Error(body?.error?.message ?? 'غیرفعال‌سازی فروشگاه ناموفق بود.');
      toast.success('فروشگاه غیرفعال شد.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'غیرفعال‌سازی ناموفق بود.');
    } finally { setBusy(false); }
  }
  return <Button type="button" variant="outline" className="text-destructive" onClick={() => void deactivate()} disabled={busy}><Trash2 className="h-4 w-4" />{busy ? 'در حال غیرفعال‌سازی…' : 'غیرفعال‌کردن فروشگاه'}</Button>;
}
