'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Check, X, FolderTree } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminCategoryRow } from '@/features/admin/lib/mock-data';

interface CategoryManagerProps { initial: AdminCategoryRow[] }

export function CategoryManager({ initial }: CategoryManagerProps) {
  const router = useRouter();
  const [items, setItems] = React.useState(initial);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftName, setDraftName] = React.useState('');
  const [showNew, setShowNew] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newKey, setNewKey] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => setItems(initial), [initial]);

  async function createCategory() {
    if (!newName.trim() || !newKey.trim()) { toast.error('نام و کلید الزامی است'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/categories', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), key: newKey.trim() }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) toast.error(data?.error?.message ?? 'ایجاد دسته‌بندی ناموفق بود');
      else { toast.success('دسته‌بندی ایجاد شد'); setShowNew(false); setNewName(''); setNewKey(''); router.refresh(); }
    } catch { toast.error('خطای شبکه'); } finally { setBusy(false); }
  }

  async function saveEdit(id: string) {
    if (!draftName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: draftName.trim() }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) toast.error(data?.error?.message ?? 'به‌روزرسانی ناموفق بود');
      else { toast.success('دسته‌بندی ذخیره شد'); setEditingId(null); router.refresh(); }
    } catch { toast.error('خطای شبکه'); } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (typeof window !== 'undefined' && !window.confirm('آیا این دسته‌بندی حذف شود؟')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) toast.error(data?.error?.message ?? 'حذف ناموفق بود');
      else { toast.success('دسته‌بندی حذف شد'); router.refresh(); }
    } catch { toast.error('خطای شبکه'); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FolderTree className="h-5 w-5" /></div><div><p className="text-sm font-black">ساختار دسته‌بندی فروشگاه</p><p className="mt-1 text-xs text-muted-foreground">نام و کلید هر دسته را با حفظ ساختار فعلی محصولات مدیریت کنید.</p></div></div>
        <div className="flex items-center gap-2"><span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold">{items.length} دسته</span><Button size="sm" onClick={() => setShowNew((v) => !v)}><Plus className="h-4 w-4" />افزودن دسته</Button></div>
      </div>

      {showNew && <Card className="p-5"><div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"><label className="space-y-2"><span className="text-xs font-bold">نام دسته</span><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثلاً صنایع دستی" /></label><label className="space-y-2"><span className="text-xs font-bold">کلید فنی</span><Input dir="ltr" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="handcrafts" /></label><div className="flex items-end gap-2"><Button onClick={createCategory} disabled={busy}>ذخیره</Button><Button variant="ghost" onClick={() => setShowNew(false)} disabled={busy}>انصراف</Button></div></div></Card>}

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[620px] text-sm">
          <thead><tr className="border-b border-border bg-muted/50"><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">دسته‌بندی</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">کلید</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">تعداد محصول</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">وضعیت</th><th className="px-4 py-3 text-end text-xs font-bold text-muted-foreground">عملیات</th></tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={5} className="px-4 py-14 text-center text-sm text-muted-foreground">هنوز دسته‌بندی‌ای ثبت نشده است.</td></tr> : items.map((c) => {
              const isEditing = editingId === c.id;
              return <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">{isEditing ? <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} autoFocus /> : <div><p className="font-bold">{c.name}</p><p className="mt-0.5 text-xs text-muted-foreground">شناسه: {c.slug}</p></div>}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground" dir="ltr">{c.key}</td>
                <td className="px-4 py-3 font-semibold">{c.productCount.toLocaleString('fa-AF')}</td>
                <td className="px-4 py-3"><span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">فعال</span></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2">{isEditing ? <><button type="button" aria-label="ذخیره" onClick={() => saveEdit(c.id)} disabled={busy} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-emerald-600 hover:bg-emerald-500/10"><Check className="h-3.5 w-3.5" /></button><button type="button" aria-label="انصراف" onClick={() => setEditingId(null)} disabled={busy} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button></> : <><button type="button" aria-label="ویرایش" onClick={() => { setEditingId(c.id); setDraftName(c.name); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button><button type="button" aria-label="حذف" onClick={() => remove(c.id)} disabled={busy} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-red-600 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button></>}</div></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
