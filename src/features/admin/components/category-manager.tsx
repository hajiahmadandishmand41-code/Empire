'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminCategoryRow } from '@/features/admin/lib/mock-data';

interface CategoryManagerProps {
  initial: AdminCategoryRow[];
}

export function CategoryManager({ initial }: CategoryManagerProps) {
  const router = useRouter();
  const [items, setItems] = React.useState(initial);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftName, setDraftName] = React.useState('');
  const [showNew, setShowNew] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newKey, setNewKey] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setItems(initial);
  }, [initial]);

  async function createCategory() {
    if (!newName.trim() || !newKey.trim()) {
      toast.error('نام و کلید الزامی است');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), key: newKey.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error?.message ?? 'ایجاد ناموفق');
      } else {
        toast.success('دسته ایجاد شد');
        setShowNew(false);
        setNewName('');
        setNewKey('');
        router.refresh();
      }
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: string) {
    if (!draftName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: draftName.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error?.message ?? 'به‌روزرسانی ناموفق');
      } else {
        toast.success('ذخیره شد');
        setEditingId(null);
        router.refresh();
      }
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (typeof window !== 'undefined' && !window.confirm('این دسته حذف شود؟')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error?.message ?? 'حذف ناموفق');
      } else {
        toast.success('حذف شد');
        router.refresh();
      }
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">مجموع {items.length} دسته</p>
        <Button size="sm" onClick={() => setShowNew((v) => !v)}>
          <Plus className="h-4 w-4" />
          افزودن دسته
        </Button>
      </div>

      {showNew && (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">نام</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="مثلاً: صنایع دستی"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">کلید (به انگلیسی)</label>
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="clothing"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={createCategory} disabled={busy}>
              ذخیره
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNew(false)} disabled={busy}>
              انصراف
            </Button>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                نام
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                کلید
              </th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                تعداد محصولات
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  دسته‌ای موجود نیست.
                </td>
              </tr>
            ) : (
              items.map((c) => {
                const isEditing = editingId === c.id;
                return (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Input
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium">{c.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.key}</td>
                    <td className="px-4 py-3">{c.productCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              aria-label="ذخیره"
                              onClick={() => saveEdit(c.id)}
                              disabled={busy}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-emerald-600 hover:bg-emerald-500/10"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="انصراف"
                              onClick={() => setEditingId(null)}
                              disabled={busy}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              aria-label="ویرایش"
                              onClick={() => {
                                setEditingId(c.id);
                                setDraftName(c.name);
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="حذف"
                              onClick={() => remove(c.id)}
                              disabled={busy}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-red-600 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
