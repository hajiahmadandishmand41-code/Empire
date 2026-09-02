'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Power, Tag, Search } from 'lucide-react';

type Brand = { id: string; name: string; slug: string; description: string | null; logoUrl: string | null; isActive: boolean; productCount: number };

export function BrandManager() {
  const [items, setItems] = React.useState<Brand[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [editing, setEditing] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/seller/brands', { credentials: 'include', cache: 'no-store' });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? 'خطا در دریافت برندها');
      setItems(Array.isArray(body.data) ? body.data : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در دریافت برندها');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { void load(); }, []);

  function reset() {
    setEditing(null); setName(''); setSlug(''); setDescription('');
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return toast.error('نام برند الزامی است.');
    setBusy(true);
    try {
      const endpoint = editing ? `/api/seller/brands/${editing}` : '/api/seller/brands';
      const response = await fetch(endpoint, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() || undefined, description: description.trim() || null }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? 'ذخیره برند ناموفق بود');
      toast.success(editing ? 'برند ویرایش شد.' : 'برند ایجاد شد.');
      reset();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ذخیره ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, active: boolean) {
    try {
      const response = await fetch(`/api/seller/brands/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !active }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? 'تغییر وضعیت برند ناموفق بود');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا');
    }
  }

  const filtered = items.filter((brand) => {
    const q = query.trim().toLowerCase();
    return !q || brand.name.toLowerCase().includes(q) || brand.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5" dir="rtl">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold text-primary">Seller Center</p><h1 className="mt-1 text-2xl font-black">برندهای فروشگاه</h1><p className="mt-2 text-sm text-muted-foreground">برندها را مدیریت کنید و سپس در محصولات فروشگاه به آن‌ها متصل کنید.</p></div>
          <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />برند جدید</button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <form onSubmit={save} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /><h2 className="text-lg font-black">{editing ? 'ویرایش برند' : 'افزودن برند'}</h2></div>
          <div className="mt-5 space-y-3">
            <label className="block text-xs font-bold">نام برند<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" /></label>
            <label className="block text-xs font-bold">Slug<input value={slug} onChange={(e) => setSlug(e.target.value)} dir="ltr" placeholder="brand-name" className="mt-2 h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" /></label>
            <label className="block text-xs font-bold">توضیحات<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-input bg-background p-3 text-sm outline-none focus:border-primary" /></label>
            <div className="flex gap-2"><button disabled={busy} className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">{editing ? 'ذخیره تغییرات' : 'ایجاد برند'}</button>{editing ? <button type="button" onClick={reset} className="rounded-2xl border border-border px-4 py-3 text-sm font-bold">انصراف</button> : null}</div>
          </div>
        </form>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black">فهرست برندها</h2><p className="mt-1 text-xs text-muted-foreground">هر برند به فروشنده فعلی محدود است.</p></div><div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی برند..." className="h-10 w-full rounded-xl border border-input bg-background ps-9 pe-3 text-sm outline-none focus:border-primary" /></div></div>
          {loading ? <div className="py-16 text-center text-sm text-muted-foreground">در حال بارگذاری…</div> : filtered.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">برندی پیدا نشد.</div> : <div className="mt-5 space-y-2">{filtered.map((brand) => <div key={brand.id} className="flex items-center gap-3 rounded-2xl border border-border p-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted"><Tag className="h-5 w-5 text-primary" /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{brand.name}</div><div className="text-xs text-muted-foreground">{brand.productCount.toLocaleString('fa-IR')} محصول · {brand.isActive ? 'فعال' : 'غیرفعال'}</div></div><button type="button" onClick={() => { setEditing(brand.id); setName(brand.name); setSlug(brand.slug); setDescription(brand.description ?? ''); }} className="rounded-xl border border-border p-2" aria-label="ویرایش"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void toggle(brand.id, brand.isActive)} className="rounded-xl border border-border p-2" aria-label={brand.isActive ? 'غیرفعال کردن' : 'فعال کردن'}><Power className={`h-4 w-4 ${brand.isActive ? 'text-emerald-600' : 'text-muted-foreground'}`} /></button></div>)}</div>}
        </section>
      </div>
    </div>
  );
}
