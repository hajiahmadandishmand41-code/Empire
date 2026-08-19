'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

export function HomepageFeatureToggle({ id, active }: { id: string; active: boolean }) {
  const [busy, setBusy] = React.useState(false);
  const [enabled, setEnabled] = React.useState(active);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/homepage-featured', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, enabled: !enabled }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        toast.error(body?.error?.message ?? 'ذخیره ناموفق بود');
        return;
      }
      setEnabled(!enabled);
      toast.success(!enabled ? 'محصول به اسلاید اصلی اضافه شد' : 'محصول از اسلاید اصلی حذف شد');
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      title="اسلاید اصلی"
      aria-label="اسلاید اصلی"
      aria-pressed={enabled}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-amber-500 transition-colors hover:bg-amber-50 disabled:opacity-50 dark:hover:bg-amber-950/20"
    >
      <Star className={enabled ? 'h-4 w-4 fill-amber-400 text-amber-500' : 'h-4 w-4'} aria-hidden />
    </button>
  );
}
