'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Power, Tag, Search, X } from 'lucide-react';

type Brand = { id: string; name: string; slug: string; description: string | null; logoUrl: string | null; isActive: boolean; productCount: number };
const slugify = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/[\s_-]+/gu, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

export function BrandManager() {
  const [items, setItems] = React.useState<Brand[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const [editing, setEditing] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<'all' | 'active' | 'inactive'>('all');

  React.useEffect(() => { if (!slugTouched) setSlug(slugify(name)); }, [name, slugTouched]);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/seller/brands', { credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' } });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? 'خطا در دریافت برندها');
      setItems(Array.isArray(body.data) ? body.data : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در دریافت برندها');
    } finally { setLoading(false); }
  }

  React.useEffect(() => { void load(); }, []);

  function reset() { setEditing(null); setName(''); setSlug(''); setSlugTouched(false); setDescription(''); }

  function edit(brand: Brand) {
    setEditing(brand.id); setName(brand.name); setSlug(brand.slug); setSlugTouched(true); setDescription(brand.description ?? '');
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const cleanName = name.trim();
    const cleanSlug = (slug.trim() || slugify(cleanName));
    if (cleanName.length < 2) return toast.error('نام برند حداقل ۲ حرف باشد.');
    if (!cleanSlug) return toast.error('شناسه برند معتبر نیست.');
    setBusy(true);
    try {
      const endpoint = editing ? `/api/seller/brands/${editing}` : '/api/seller/brands';
      const response = await fetch(endpoint, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: cleanName, slug: cleanSlug, description: description.trim() || null }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? 'ذخیره برند ناموفق بود');
      toast.success(editing ? 'برند ویرایش شد.' : 'برند ایجاد شد.');
      reset();
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'ذخیره ناموفق بود'); }
    finally { setBusy(false); }
  }

  async function toggle(id: string, active: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/seller/brands/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, credentials: 'include', body: JSON.stringify({ isActive: !active }) });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error?.message ?? 'تغییر وضعیت برند ناموفق بود');
      await load();
      toast.success(active ? 'برند غیرفعال شد.' : 'برند فعال شد.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'خطا'); }
    finally { setBusy(false); }
  }

  const filtered = items.filter((brand) => {
    const q = query.trim().toLocaleLowerCase();
    const matchesQuery = !q || brand.name.toLocaleLowerCase().includes(q) || brand.slug.toLocaleLowerCase().includes(q);
    const matchesStatus = status === 'all' || (status === 'active' ? brand.isActive : !brand.isActive);
    return matchesQuery && matchesStatus;
  });
  const activeCount = items.filter((brand) => brand.isActive).length;

  return (
    <div className="space-y-5" dir="rtl">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold text-primary">Seller Center / Brands</p><h1 className="mt-1 text-2xl font-black">مدیریت برندها</h1><p className="mt-2 text-sm text-muted-foreground">برندها فقط در محدوده حساب فروشنده فعلی مدیریت می‌شوند و برای اتصال به محصولات آماده هستند.</p></div>
          <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />برند جدید</button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-muted/30 p-4"><p className="text-[11px] text-muted-foreground">کل برندها</p><p className="mt-1 text-xl font-black">{items.length.toLocaleString('fa-IR')}</p></div><div className="rounded-2xl border border-border bg-muted/30 p-4"><p className="text-[11px] text-muted-foreground">فعال</p><p className="mt-1 text-xl font-black">{activeCount.toLocaleString('fa-IR')}</p></div><div className="hidden rounded-2xl border border-border bg-muted/30 p-4 sm:block"><p className="text-[11px] text-muted-foreground">نتیجه جستجو</p><p className="mt-1 text-xl font-black">{filtered.length.toLocaleString('fa-IR')}</p></div></div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <form onSubmit={save} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /><h2 className="text-lg font-black">{editing ? 'ویرایش برند' : 'افزودن برند'}</h2></div>{editing ? <button type="button" onClick={reset} className="rounded-xl border border-border p-2" aria-label="بستن فرم"><X className="h-4 w-4" /></button> : null}</div>
          <div className="mt-5 space-y-3">
            <label className="block text-xs font-bold">نام برند<input autoFocus={Boolean(editing)} value={name} onChange={(e) => { setName(e.target.value); if (slugTouched && !slug) setSlug(slugify(e.target.value)); }} maxLength={120} required className="mt-2 h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" /></label>
            <label className="block text-xs font-bold">Slug<input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} dir="ltr" maxLength={120} placeholder="brand-name" className="mt-2 h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" /></label>
            <label className="block text-xs font-bold">توضیحات<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={1000} className="mt-2 w-full rounded-2xl border border-input bg-background p-3 text-sm outline-none focus:border-primary" /></label>
            <div className="flex gap-2"><button disabled={busy} className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">{busy ? 'در حال ذخیره…' : editing ? 'ذخیره تغییرات' : 'ایجاد برند'}</button>{editing ? <button type="button" disabled={busy} onClick={reset} className="rounded-2xl border border-border px-4 py-3 text-sm font-bold">انصراف</button> : null}</div>
          </div>
        </form>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black">فهرست برندها</h2><p className="mt-1 text-xs text-muted-foreground">جستجو و فیلتر روی داده واقعی فروشنده انجام می‌شود.</p></div><div className="flex w-full gap-2 sm:w-auto"><div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی برند…" className="h-10 w-full rounded-xl border border-input bg-background ps-9 pe-3 text-sm outline-none focus:border-primary" /></div><select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold"><option value="all">همه</option><option value="active">فعال</option><option value="inactive">غیرفعال</option></select></div></div>
          {loading ? <div className="py-16 text-center text-sm text-muted-foreground">در حال بارگذاری…</div> : filtered.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">برندی با این فیلتر پیدا نشد.</div> : <div className="mt-5 space-y-2">{filtered.map((brand) => <div key={brand.id} className="flex items-center gap-3 rounded-2xl border border-border p-3 transition hover:bg-muted/30"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">{brand.logoUrl ? <img src={brand.logoUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Tag className="h-5 w-5 text-primary" />}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{brand.name}</div><div className="mt-0.5 text-xs text-muted-foreground">{brand.slug} · {brand.productCount.toLocaleString('fa-IR')} محصول</div><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${brand.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>{brand.isActive ? 'فعال' : 'غیرفعال'}</span></div><button type="button" disabled={busy} onClick={() => edit(brand)} className="rounded-xl border border-border p-2 disabled:opacity-50" aria-label="ویرایش"><Pencil className="h-4 w-4" /></button><button type="button" disabled={busy} onClick={() => void toggle(brand.id, brand.isActive)} className="rounded-xl border border-border p-2 disabled:opacity-50" aria-label={brand.isActive ? 'غیرفعال کردن' : 'فعال کردن'}><Power className={`h-4 w-4 ${brand.isActive ? 'text-emerald-600' : 'text-muted-foreground'}`} /></button></div>)}</div>}
        </section>
      </div>
    </div>
  );
}
