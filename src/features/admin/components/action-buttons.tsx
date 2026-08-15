'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/* Add / Edit / Delete — Phase 10.2 / 10.3.
 * These buttons wire to existing admin API endpoints; complex forms
 * are intentionally out of scope for this phase. */

export function AddButton({ label }: { label: string }) {
  return (
    <Button size="sm" variant="primary" onClick={() => toast('در نسخه بعدی: فرم افزودن')}>
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  );
}

export function EditIconButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick ?? (() => toast('در نسخه بعدی: فرم ویرایش'))}
      aria-label="ویرایش"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted"
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
}

interface DeleteIconButtonProps {
  endpoint: string;
  confirmMessage?: string;
}

export function DeleteIconButton({ endpoint, confirmMessage }: DeleteIconButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function onDelete() {
    if (typeof window !== 'undefined' && !window.confirm(confirmMessage ?? 'حذف شود؟')) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        toast.error(body?.error?.message ?? 'حذف ناموفق بود');
      } else {
        toast.success('با موفقیت حذف شد');
        router.refresh();
      }
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onDelete}
      aria-label="حذف"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
