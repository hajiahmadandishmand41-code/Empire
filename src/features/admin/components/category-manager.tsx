'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Check, X, FolderTree, Upload, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminCategoryRow } from '@/features/admin/lib/mock-data';

type AdminCategory = AdminCategoryRow & {
  parentId?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

interface CategoryManagerProps { initial: AdminCategoryRow[] }

type ImagePickerProps = {
  value?: string | null;
  busy?: boolean;
  onUploaded: (url: string) => void;
};

function ImagePicker({ value, busy, onUploaded }: ImagePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(value ?? null);

  React.useEffect(() => { setPreview(value ?? null); }, [value]);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('فرمت تصویر باید JPG، PNG، WEBP یا GIF باشد.');
      return;
    }
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
      toast.error('حداکثر حجم تصویر ۱۰ مگابایت است.');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.set('file', file);
      const response = await fetch('/api/admin/media', { method: 'POST', body: form });
      const data = await response.json().catch(() => null) as { ok?: boolean; data?: { url?: string } } | null;
      if (!response.ok || !data?.ok || !data.data?.url) throw new Error('upload_failed');
      setPreview(data.data.url);
      onUploaded(data.data.url);
      toast.success('تصویر با موفقیت آپلود شد.');
    } catch {
      toast.error('آپلود تصویر ناموفق بود.');
    } finally {
      setUploading(false);
    }
  }

  const loading = busy || uploading;
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="group relative flex h-28 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/20 transition hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {preview ? <img src={preview} alt="پیش‌نمایش تصویر دسته" className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-2 text-muted-foreground"><ImageIcon className="h-6 w-6" /><span className="text-xs font-semibold">برای آپلود تصویر کلیک کنید</span></div>}
        <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-xl bg-black/55 px-2 py-1.5 text-[11px] font-bold text-white opacity-0 backdrop-blur transition group-hover:opacity-100"><Upload className="h-3.5 w-3.5" />{uploading ? 'در حال آپلود…' : 'انتخاب / تغییر تصویر'}</span>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { void upload(e.target.files?.[0]); e.currentTarget.value = ''; }} />
    </div>
  );
}

export function CategoryManager({ initial }: CategoryManagerProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<AdminCategory[]>(initial);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Partial<AdminCategory>>({});
  const [showNew, setShowNew] = React.useState(false);
  const [newDraft, setNewDraft] = React.useState({ name: '', key: '', parentId: '', imageUrl: '', sortOrder: 0 });
  const [busy, setBusy] = React.useState(false);

  const reload = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories', { cache: 'no-store' });
      const body = await res.json().catch(() => null) as { ok?: boolean; data?: AdminCategory[] } | null;
      if (res.ok && body?.ok && Array.isArray(body.data)) setItems(body.data);
    } catch { /* keep current UI state */ }
  }, []);

  React.useEffect(() => { void reload(); }, [reload]);

  async function createCategory() {
    if (!newDraft.name.trim() || !newDraft.key.trim()) { toast.error('نام و کلید الزامی است'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: newDraft.name.trim(), key: newDraft.key.trim(), parentId: newDraft.parentId || null, imageUrl: newDraft.imageUrl || null, sortOrder: Number(newDraft.sortOrder) || 0 }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) toast.error(data?.error?.message ?? 'ایجاد دسته‌بندی ناموفق بود');
      else { toast.success('دسته‌بندی ایجاد شد'); setShowNew(false); setNewDraft({ name: '', key: '', parentId: '', imageUrl: '', sortOrder: 0 }); await reload(); router.refresh(); }
    } catch { toast.error('خطای شبکه'); } finally { setBusy(false); }
  }

  async function saveEdit(id: string) {
    setBusy(true);
    try {
      const payload = { name: draft.name?.trim(), parentId: draft.parentId || null, imageUrl: draft.imageUrl || null, sortOrder: Number(draft.sortOrder ?? 0), isActive: draft.isActive !== false };
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) toast.error(data?.error?.message ?? 'به‌روزرسانی ناموفق بود');
      else { toast.success('دسته‌بندی ذخیره شد'); setEditingId(null); await reload(); router.refresh(); }
    } catch { toast.error('خطای شبکه'); } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (typeof window !== 'undefined' && !window.confirm('آیا این دسته‌بندی حذف شود؟')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) toast.error(data?.error?.message ?? 'حذف ناموفق بود');
      else { toast.success('دسته‌بندی حذف شد'); await reload(); router.refresh(); }
    } catch { toast.error('خطای شبکه'); } finally { setBusy(false); }
  }

  const roots = items.filter((item) => !item.parentId);
  const parentName = (parentId?: string | null) => items.find((item) => item.id === parentId)?.name ?? '—';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FolderTree className="h-5 w-5" /></div><div><p className="text-sm font-black">ساختار دسته‌بندی فروشگاه</p><p className="mt-1 text-xs text-muted-foreground">دسته اصلی، زیر‌دسته، ترتیب، تصویر و وضعیت فعال را مستقیماً مدیریت کنید.</p></div></div>
        <div className="flex items-center gap-2"><span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold">{items.length} دسته</span><Button size="sm" onClick={() => setShowNew((v) => !v)}><Plus className="h-4 w-4" />افزودن دسته</Button></div>
      </div>

      {showNew && <Card className="p-5"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <label className="space-y-2"><span className="text-xs font-bold">نام دسته</span><Input value={newDraft.name} onChange={(e) => setNewDraft((v) => ({ ...v, name: e.target.value }))} /></label>
        <label className="space-y-2"><span className="text-xs font-bold">کلید فنی</span><Input dir="ltr" value={newDraft.key} onChange={(e) => setNewDraft((v) => ({ ...v, key: e.target.value }))} placeholder="handcrafts" /></label>
        <label className="space-y-2"><span className="text-xs font-bold">دسته اصلی</span><select value={newDraft.parentId} onChange={(e) => setNewDraft((v) => ({ ...v, parentId: e.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">دسته اصلی</option>{roots.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="space-y-2"><span className="text-xs font-bold">ترتیب</span><Input type="number" min={0} value={newDraft.sortOrder} onChange={(e) => setNewDraft((v) => ({ ...v, sortOrder: Number(e.target.value) || 0 }))} /></label>
        <div className="space-y-2"><span className="text-xs font-bold">تصویر دسته</span><ImagePicker value={newDraft.imageUrl} busy={busy} onUploaded={(url) => setNewDraft((v) => ({ ...v, imageUrl: url }))} /></div>
        <div className="flex items-end gap-2 md:col-span-2 lg:col-span-5"><Button onClick={createCategory} disabled={busy}>ذخیره</Button><Button variant="ghost" onClick={() => setShowNew(false)} disabled={busy}>انصراف</Button></div>
      </div></Card>}

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[1080px] text-sm">
          <thead><tr className="border-b border-border bg-muted/50"><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">دسته‌بندی</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">تصویر</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">والد</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">کلید</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">تعداد محصول</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">ترتیب</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">وضعیت</th><th className="px-4 py-3 text-end text-xs font-bold text-muted-foreground">عملیات</th></tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={8} className="px-4 py-14 text-center text-sm text-muted-foreground">هنوز دسته‌بندی‌ای ثبت نشده است.</td></tr> : items.map((c) => {
              const isEditing = editingId === c.id;
              return <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">{isEditing ? <Input value={String(draft.name ?? '')} onChange={(e) => setDraft((v) => ({ ...v, name: e.target.value }))} /> : <div><p className="font-bold">{c.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{c.slug}</p></div>}</td>
                <td className="px-4 py-3">{isEditing ? <ImagePicker value={String(draft.imageUrl ?? '') || null} busy={busy} onUploaded={(url) => setDraft((v) => ({ ...v, imageUrl: url }))} /> : c.imageUrl ? <img src={c.imageUrl} alt="" className="h-11 w-16 rounded-xl border border-border object-cover" /> : <div className="flex h-11 w-16 items-center justify-center rounded-xl bg-muted text-muted-foreground"><ImageIcon className="h-4 w-4" /></div>}</td>
                <td className="px-4 py-3">{isEditing ? <select value={String(draft.parentId ?? '')} onChange={(e) => setDraft((v) => ({ ...v, parentId: e.target.value || null }))} className="h-9 min-w-36 rounded-md border border-input bg-background px-2 text-xs"><option value="">دسته اصلی</option>{roots.filter((root) => root.id !== c.id).map((root) => <option key={root.id} value={root.id}>{root.name}</option>)}</select> : parentName(c.parentId)}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground" dir="ltr">{c.key}</td>
                <td className="px-4 py-3 font-semibold">{c.productCount.toLocaleString('fa-AF')}</td>
                <td className="px-4 py-3">{isEditing ? <Input className="w-20" type="number" min={0} value={Number(draft.sortOrder ?? 0)} onChange={(e) => setDraft((v) => ({ ...v, sortOrder: Number(e.target.value) || 0 }))} /> : c.sortOrder ?? 0}</td>
                <td className="px-4 py-3">{isEditing ? <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={draft.isActive !== false} onChange={(e) => setDraft((v) => ({ ...v, isActive: e.target.checked }))} />فعال</label> : <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${c.isActive === false ? 'bg-muted text-muted-foreground' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}>{c.isActive === false ? 'غیرفعال' : 'فعال'}</span>}</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2">{isEditing ? <><button type="button" aria-label="ذخیره" onClick={() => saveEdit(c.id)} disabled={busy} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-emerald-600 hover:bg-emerald-500/10"><Check className="h-3.5 w-3.5" /></button><button type="button" aria-label="انصراف" onClick={() => setEditingId(null)} disabled={busy} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button></> : <><button type="button" aria-label="ویرایش" onClick={() => { setEditingId(c.id); setDraft({ ...c }); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button><button type="button" aria-label="حذف" onClick={() => remove(c.id)} disabled={busy} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-red-600 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button></>}</div></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}