'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const ROLES = [
  { value: 'customer', label: 'مشتری' },
  { value: 'seller', label: 'فروشنده' },
  { value: 'admin', label: 'مدیر' },
] as const;

interface UserActionsProps {
  userId: string;
  role: 'customer' | 'seller' | 'admin';
  isActive: boolean;
}

export function UserActions({ userId, role, isActive }: UserActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [r, setR] = React.useState(role);
  const [active, setActive] = React.useState(isActive);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error?.message ?? 'به‌روزرسانی ناموفق');
        return false;
      }
      router.refresh();
      return true;
    } catch {
      toast.error('خطای شبکه');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onRoleChange(next: string) {
    const prev = r;
    setR(next as typeof r);
    if (!(await patch({ role: next }))) setR(prev);
    else toast.success('نقش تغییر کرد');
  }

  async function onToggleActive() {
    const next = !active;
    setActive(next);
    if (!(await patch({ isActive: next }))) setActive(!next);
    else toast.success(next ? 'حساب فعال شد' : 'حساب غیرفعال شد');
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={r}
        disabled={busy}
        onChange={(e) => onRoleChange(e.target.value)}
        aria-label="نقش"
        className="h-8 rounded-md border border-border bg-background px-2 text-xs disabled:opacity-50"
      >
        {ROLES.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onToggleActive}
        disabled={busy}
        className={
          'inline-flex h-8 items-center rounded-md border px-2 text-xs transition-colors disabled:opacity-50 ' +
          (active
            ? 'border-emerald-600/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
            : 'border-border bg-muted text-muted-foreground hover:bg-muted/70')
        }
      >
        {active ? 'فعال' : 'غیرفعال'}
      </button>
    </div>
  );
}
