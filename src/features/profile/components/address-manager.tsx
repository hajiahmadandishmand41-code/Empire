'use client';

import * as React from 'react';
import { Loader2, MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AFGHAN_PROVINCES } from '@/lib/afghanistan';
import type { ShippingAddress } from '@/types';

const empty: ShippingAddress = {
  label: '',
  fullName: '',
  phone: '',
  province: '',
  district: '',
  city: '',
  addressLine: '',
  notes: '',
  isDefault: false,
};

export function AddressManager() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<ShippingAddress[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<ShippingAddress | null>(null);
  const [saving, setSaving] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/addresses');
      const json = (await res.json()) as { ok: boolean; data?: { items: ShippingAddress[] } };
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
      const url = isNew ? '/api/addresses' : `/api/addresses/${editing.id}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const json = (await res.json()) as { ok: boolean; error?: { message?: string } };
      if (!json.ok) {
        toast({ title: 'خطا', description: json.error?.message ?? 'ذخیره ناموفق بود', variant: 'destructive' });
        return;
      }
      toast({ title: 'ذخیره شد', description: 'آدرس با موفقیت ذخیره شد.' });
      setEditing(null);
      await refresh();
    } finally { setSaving(false); }
  }

  async function handleDelete(id?: string) {
    if (!id) return;
    if (!confirm('حذف این آدرس؟')) return;
    const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
    const json = (await res.json()) as { ok: boolean };
    if (json.ok) { toast({ title: 'حذف شد' }); await refresh(); }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-navy-800">آدرس‌های من</h2>
        <Button size="sm" variant="gold" className="gap-2" onClick={() => setEditing({ ...empty })}>
          <Plus className="h-4 w-4" aria-hidden />
          افزودن آدرس
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> در حال بارگذاری…
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">هنوز آدرسی ذخیره نکرده‌اید.</p>
      ) : (
        <ul className="grid gap-3">
          {items.map((a) => (
            <li key={a.id} className="rounded-xl border border-border/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                  <div className="text-sm">
                    <div className="font-medium text-navy-800">
                      {a.label ?? a.fullName}
                      {a.isDefault ? (
                        <span className="me-2 rounded-full bg-gold-500/20 px-2 py-0.5 text-xs">پیش‌فرض</span>
                      ) : null}
                    </div>
                    <div className="text-muted-foreground">
                      {a.province} — {a.district}{a.city ? ` — ${a.city}` : ''}
                    </div>
                    <div className="text-muted-foreground">{a.addressLine}</div>
                    <div dir="ltr" className="text-muted-foreground">{a.phone}</div>
                    {a.notes ? <div className="text-xs text-muted-foreground">توضیحات: {a.notes}</div> : null}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing({ ...a })}>
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <form onSubmit={handleSave} className="mt-6 grid gap-3 rounded-xl border border-border/70 p-4">
          <h3 className="font-semibold text-navy-800">{editing.id ? 'ویرایش آدرس' : 'آدرس جدید'}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="عنوان (مثلاً خانه)"><Input value={editing.label ?? ''} onChange={(e) => setEditing({ ...editing, label: e.target.value })} /></Field>
            <Field label="نام گیرنده *"><Input required value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} /></Field>
            <Field label="شماره تماس *"><Input required dir="ltr" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
            <Field label="ولایت *">
              <select
                required
                value={editing.province}
                onChange={(e) => setEditing({ ...editing, province: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">انتخاب کنید…</option>
                {AFGHAN_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="ولسوالی *"><Input required value={editing.district} onChange={(e) => setEditing({ ...editing, district: e.target.value })} /></Field>
            <Field label="شهر / منطقه"><Input value={editing.city ?? ''} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></Field>
            <Field label="آدرس کامل *" className="sm:col-span-2">
              <Input required value={editing.addressLine} onChange={(e) => setEditing({ ...editing, addressLine: e.target.value })} />
            </Field>
            <Field label="توضیحات آدرس" className="sm:col-span-2">
              <textarea
                rows={2}
                value={editing.notes ?? ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={!!editing.isDefault}
                onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
              />
              پیش‌فرض کن
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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
