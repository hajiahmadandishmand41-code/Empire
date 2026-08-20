'use client';

import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Search, Trash2, Video } from 'lucide-react';

type MediaItem = { id: string; url: string; kind: 'image' | 'video'; altText?: string | null; fileName?: string | null };

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'all' | 'image' | 'video'>('all');

  async function load() {
    const r = await fetch('/api/admin/media');
    const j = await r.json();
    setItems((j.data?.rows ?? []) as MediaItem[]);
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = !query || `${item.fileName ?? ''} ${item.altText ?? ''}`.toLowerCase().includes(query);
      const matchesKind = kind === 'all' || item.kind === kind;
      return matchesQuery && matchesKind;
    });
  }, [items, q, kind]);

  async function upload() {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setStatus('حداکثر حجم فایل ۲۰ مگابایت است.');
      return;
    }
    setStatus('در حال آپلود…');
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/admin/media', { method: 'POST', body: fd });
    setStatus(r.ok ? 'رسانه با موفقیت آپلود شد.' : 'آپلود رسانه ناموفق بود.');
    if (r.ok) { setFile(null); await load(); }
  }

  async function remove(id: string, url: string) {
    if (!confirm('این رسانه حذف شود؟ این عملیات روی فایل ذخیره‌شده نیز اثر می‌گذارد.')) return;
    const r = await fetch(`/api/admin/media?id=${encodeURIComponent(id)}&url=${encodeURIComponent(url)}`, { method: 'DELETE' });
    if (r.ok) await load(); else setStatus('حذف رسانه ناموفق بود.');
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-border bg-card p-6">
        <p className="text-xs font-bold text-primary">مرکز محتوای تصویری</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-black">کتابخانه رسانه</h1><p className="mt-2 text-sm text-muted-foreground">تصویر و ویدیو را با جستجو، فیلتر و پیش‌نمایش مدیریت کنید.</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">{items.length.toLocaleString('fa-IR')} فایل</span></div>
      </header>

      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-input bg-background px-3"><Search className="h-4 w-4 text-muted-foreground"/><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو بر اساس نام فایل یا متن جایگزین…" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>
            <div className="flex rounded-xl bg-muted p-1"><button type="button" onClick={() => setKind('all')} className={`rounded-lg px-3 py-2 text-xs font-bold ${kind === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>همه</button><button type="button" onClick={() => setKind('image')} className={`rounded-lg px-3 py-2 text-xs font-bold ${kind === 'image' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>تصویر</button><button type="button" onClick={() => setKind('video')} className={`rounded-lg px-3 py-2 text-xs font-bold ${kind === 'video' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>ویدیو</button></div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="max-w-full text-sm"/><button disabled={!file} onClick={() => void upload()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"><ImagePlus className="h-4 w-4"/> آپلود رسانه</button></div>
        </div>
        {status && <p className="mt-3 text-xs font-semibold text-muted-foreground">{status}</p>}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map((item) => <article key={item.id} className="group overflow-hidden rounded-2xl border border-border bg-card"><div className="relative aspect-square bg-muted">{item.kind === 'video' ? <video src={item.url} controls preload="metadata" className="h-full w-full object-cover"/> : <img src={item.url} alt={item.altText ?? item.fileName ?? 'رسانه'} className="h-full w-full object-cover" loading="lazy"/>}<span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-bold shadow-sm">{item.kind === 'video' ? <Video className="h-3 w-3"/> : <ImagePlus className="h-3 w-3"/>}{item.kind === 'video' ? 'ویدیو' : 'تصویر'}</span></div><div className="space-y-2 p-3"><div className="truncate text-xs font-bold" title={item.fileName ?? undefined}>{item.fileName ?? item.kind}</div><div className="truncate text-[10px] text-muted-foreground" title={item.altText ?? undefined}>{item.altText ?? 'بدون متن جایگزین'}</div><button type="button" onClick={() => void remove(item.id, item.url)} className="inline-flex items-center gap-1 text-xs font-bold text-destructive"><Trash2 className="h-3.5 w-3.5"/> حذف</button></div></article>)}
        {filtered.length === 0 && <div className="col-span-full rounded-3xl border border-dashed border-border p-14 text-center text-sm text-muted-foreground">رسانه‌ای مطابق فیلترهای فعلی پیدا نشد.</div>}
      </section>
    </div>
  );
}
