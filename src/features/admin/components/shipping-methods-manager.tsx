'use client';

import * as React from 'react';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { ShippingMethod, ShippingKind } from '@/types';

const empty: ShippingMethod = {
  id: '',
  key: '',
  name: '',
  description: '',
  kind: 'standard',
  cost: 0,
  currency: 'AFN',
  etaDays: undefined,
  isActive: true,
  sortOrder: 0,
};

const KINDS: ShippingKind[] = ['standard', 'express', 'cod'];

export function ShippingMethodsManager() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<ShippingMethod[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<ShippingMethod | null>(null);
  const [saving, setSaving] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/shipping-methods');
      const json = (await res.json()) as { ok: boolean; data?: { items: ShippingMethod[] } };
      if (json.ok && json.data) setItems(json.data.items);
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const isNew = !editing.id;
      const url = isNew ? '/api/admin/shipping-methods' : `/api/admin/shipping-methods/${editing.id}`;
      const payload = {
        key: editing.key,
        name: editing.name,
        description: editing.description,
        kind: editing.kind,
        cost: Number(editing.cost),
        currency: editing.currency,
        etaDays: editing.etaDays ? Number(editing.etaDays) : undefined,
        isActive: editing.isActive,
        sortOrder: Number(editing.sortOrder),
      };
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: { message?: string } };
      if (!json.ok) {
        toast({ title: 'خطا', description: json.error?.message ?? 'ذخیره ناموفق', variant: 'destructive' });
        return;
      }
      toast({ title: 'ذخیره شد' });
      setEditing(null);
      await refresh();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف این روش ارسال؟')) return;
    const res = await fetch(`/api/admin/shipping-methods/${id}`, { method: 'DELETE' });
    const json = (await res.json()) as { ok: boolean };
    if (json.ok) { toast({ title: 'حذف/غیرفعال شد' }); await refresh(); }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-navy-800">روش‌های ارسال</h2>
        <Button size="sm" variant="gold" className="gap-2" onClick={() => setEditing({ ...empty })}>
          <Plus className="h-4 w-4" aria-hidden /> افزودن روش
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> در حال بارگذاری…
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">روشی تعریف نشده است.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-start text-muted-foreground">
              <tr><th className="py-2">نام</th><th>کلید</th><th>نوع</th><th>هزینه</th><th>ETA</th><th>فعال</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-t border-border/70">
                  <td className="py-2 font-medium text-navy-800">{m.name}</td>
                  <td dir="ltr">{m.key}</td>
                  <td>{m.kind}</td>
                  <td dir="ltr">{m.cost} {m.currency}</td>
                  <td dir="ltr">{m.etaDays ?? '—'}</td>
                  <td>{m.isActive ? '✓' : '✗'}</td>
                  <td className="text-end">
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ ...m })}>
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSave} className="mt-6 grid gap-3 rounded-xl border border-border/70 p-4">
          <h3 className="font-semibold text-navy-800">{editing.id ? 'ویرایش روش ارسال' : 'روش ارسال جدید'}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="کلید *"><Input required dir="ltr" value={editing.key} onChange={(e) => setEditing({ ...editing, key: e.target.value })} /></F>
            <F label="نام نمایشی *"><Input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></F>
            <F label="نوع">
              <select
                value={editing.kind}
                onChange={(e) => setEditing({ ...editing, kind: e.target.value as ShippingKind })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </F>
            <F label="هزینه (AFN)"><Input type="number" step="0.01" value={editing.cost} onChange={(e) => setEditing({ ...editing, cost: Number(e.target.value) })} /></F>
            <F label="زمان تخمینی (روز)"><Input type="number" value={editing.etaDays ?? ''} onChange={(e) => setEditing({ ...editing, etaDays: e.target.value ? Number(e.target.value) : undefined })} /></F>
            <F label="ترتیب"><Input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></F>
            <F label="توضیحات" className="sm:col-span-2">
              <textarea
                rows={2}
                value={editing.description ?? ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </F>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              فعال
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="gold" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              ذخیره
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>انصراف</Button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}

function F({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
