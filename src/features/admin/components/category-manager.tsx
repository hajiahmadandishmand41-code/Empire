'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Check, X, FolderTree, ImagePlus, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminCategoryRow } from '@/features/admin/lib/mock-data';

interface CategoryItem extends AdminCategoryRow { imageUrl?: string | null }
interface CategoryManagerProps { initial: AdminCategoryRow[] }

export function CategoryManager({ initial }: CategoryManagerProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<CategoryItem[]>(initial);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftName, setDraftName] = React.useState('');
  const [showNew, setShowNew] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newKey, setNewKey] = React.useState('');
  const [newImage, setNewImage] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => { void loadItems(); }, [initial]);

  async function loadItems() {
    try {
      const res = await fetch('/api/admin/categories', { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) setItems((data.data ?? initial) as CategoryItem[]);
      else setItems(initial);
    } catch { setItems(initial); }
  }

  async function uploadCategoryImage(id: string, file: File) {
    if (!file.type.startsWith('image/')) throw new Error('فقط فایل تصویری قابل قبول است.');
    if (file.size > 3 * 1024 * 1024) throw new Error('حداکثر حجم تصویر ۳ مگابایت است.');
    const fd = new FormData(); fd.set('file', file);
    const upload = await fetch('/api/admin/media', { method: 'POST', body: fd, credentials: 'same-origin' });
    const uploaded = await upload.json().catch(() => null);
    if (!upload.ok || !uploaded?.ok || !uploaded?.data?.url) throw new Error(uploaded?.error?.message ?? 'آپلود تصویر ناموفق بود.');
    const save = await fetch(`/api/admin/categories/${encodeURIComponent(id)}/image`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ url: uploaded.data.url }) });
    const saved = await save.json().catch(() => null);
    if (!save.ok || !saved?.ok) throw new Error(saved?.error?.message ?? 'ذخیره تصویر ناموفق بود.');
    return String(saved.data?.imageUrl ?? uploaded.data.url);
  }

  async function createCategory() {
    if (!newName.trim() || !newKey.trim()) { toast.error('نام و کلید الزامی است'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/categories', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name: newName.trim(), key: newKey.trim() }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? 'ایجاد دسته‌بندی ناموفق بود');
      if (newImage && data.data?.id) {
        try { await uploadCategoryImage(String(data.data.id), newImage); } catch (error) { toast.error(error instanceof Error ? `دسته ایجاد شد، تصویر ذخیره نشد: ${error.message}` : 'دسته ایجاد شد، تصویر ذخیره نشد.'); }
      }
      toast.success('دسته‌بندی ایجاد شد'); setShowNew(false); setNewName(''); setNewKey(''); setNewImage(null); await loadItems(); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'خطای شبکه'); } finally { setBusy(false); }
  }

  async function saveEdit(id: string) {
    if (!draftName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name: draftName.trim() }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? 'به‌روزرسانی ناموفق بود');
      toast.success('دسته‌بندی ذخیره شد'); setEditingId(null); await loadItems(); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'خطای شبکه'); } finally { setBusy(false); }
  }

  async function handleImage(id: string, file: File) {
    setBusy(true);
    try { const url = await uploadCategoryImage(id, file); setItems((current) => current.map((item) => item.id === id ? { ...item, imageUrl: url } : item)); toast.success('تصویر دسته ذخیره شد.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'آپلود تصویر ناموفق بود.'); }
    finally { setBusy(false); }
  }

  async function removeImage(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(id)}/image`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ url: null }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? 'حذف تصویر ناموفق بود.');
      setItems((current) => current.map((item) => item.id === id ? { ...item, imageUrl: null } : item));
    } catch (error) { toast.error(error instanceof Error ? error.message : 'خطای شبکه'); } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (typeof window !== 'undefined' && !window.confirm('آیا این دسته‌بندی حذف شود؟')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE', credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? 'حذف ناموفق بود');
      toast.success('دسته‌بندی حذف شد'); await loadItems(); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'خطای شبکه'); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FolderTree className="h-5 w-5" /></div><div><p className="text-sm font-black">ساختار دسته‌بندی فروشگاه</p><p className="mt-1 text-xs text-muted-foreground">نام، کلید و تصویر هر دسته را از یک محل مدیریت کنید.</p></div></div>
        <div className="flex items-center gap-2"><span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold">{items.length} دسته</span><Button size="sm" onClick={() => setShowNew((v) => !v)}><Plus className="h-4 w-4" />افزودن دسته</Button></div>
      </div>
      {showNew && <Card className="p-5"><div className="grid gap-4 md:grid-cols-[1fr_1fr_1.2fr_auto]"><label className="space-y-2"><span className="text-xs font-bold">نام دسته</span><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثلاً صنایع دستی" /></label><label className="space-y-2"><span className="text-xs font-bold">کلید فنی</span><Input dir="ltr" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="handcrafts" /></label><label className="space-y-2"><span className="text-xs font-bold">تصویر دسته</span><Input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setNewImage(e.target.files?.[0] ?? null)} /></label><div className="flex items-end gap-2"><Button onClick={createCategory} disabled={busy}>ذخیره</Button><Button variant="ghost" onClick={() => setShowNew(false)} disabled={busy}>انصراف</Button></div></div></Card>}
      <div className="overflow-x-auto rounded-2xl border border-border bg-background"><table className="w-full min-w-[820px] text-sm"><thead><tr className="border-b border-border bg-muted/50"><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">تصویر</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">دسته‌بندی</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">کلید</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">تعداد محصول</th><th className="px-4 py-3 text-start text-xs font-bold text-muted-foreground">وضعیت</th><th className="px-4 py-3 text-end text-xs font-bold text-muted-foreground">عملیات</th></tr></thead><tbody>
        {items.length === 0 ? <tr><td colSpan={6} className="px-4 py-14 text-center text-sm text-muted-foreground">هنوز دسته‌بندی‌ای ثبت نشده است.</td></tr> : items.map((c) => { const isEditing = editingId === c.id; return <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20"><td className="px-4 py-3"><div className="relative h-12 w-12 overflow-hidden rounded-xl border border-border bg-muted">{c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImagePlus className="h-5 w-5" /></div>}<label className="absolute inset-0 cursor-pointer opacity-0 hover:opacity-100"><span className="absolute inset-0 flex items-center justify-center bg-black/45"><Upload className="h-4 w-4 text-white" /></span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImage(c.id, file); e.currentTarget.value = ''; }} /></label></div></td><td className="px-4 py-3">{isEditing ? <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} autoFocus /> : <div><p className="font-bold">{c.name}</p><p className="mt-0.5 text-xs text-muted-foreground">شناسه: {c.slug}</p></div>}</td><td className="px-4 py-3 font-mono text-xs text-muted-foreground" dir="ltr">{c.key}</td><td className="px-4 py-3 font-semibold">{c.productCount.toLocaleString('fa-AF')}</td><td className="px-4 py-3"><span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">فعال</span></td><td className="px-4 py-3"><div className="flex justify-end gap-2">{isEditing ? <><button type="button" aria-label="ذخیره" onClick={() => void saveEdit(c.id)} disabled={busy} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-emerald-600 hover:bg-emerald-500/10"><Check className="h-3.5 w-3.5" /></button><button type="button" aria-label="انصراف" onClick={() => setEditingId(null)} disabled={busy} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button></> : <><label aria-label="آپلود تصویر" className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"><Upload className="h-3.5 w-3.5" /><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImage(c.id, file); e.currentTarget.value = ''; }} /></label>{c.imageUrl ? <button type="button" aria-label="حذف تصویر" onClick={() => void removeImage(c.id)} disabled={busy} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-amber-600 hover:bg-amber-500/10"><Trash2 className="h-3.5 w-3.5" /></button> : null}<button type="button" aria-label="ویرایش" onClick={() => { setEditingId(c.id); setDraftName(c.name); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button><button type="button" aria-label="حذف دسته" onClick={() => void remove(c.id)} disabled={busy} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-red-600 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button></>}</div></td></tr>; })}</tbody></table></div>
    </div>
  );
}
