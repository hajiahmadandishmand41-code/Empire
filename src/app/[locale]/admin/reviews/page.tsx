'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Search, Star, XCircle } from 'lucide-react';

type ReviewRow = { id: string; product: { name: string }; user: { fullName: string }; rating: number; title: string | null; comment: string | null; isApproved: boolean };

export default function ReviewsPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved'>('pending');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const r = await fetch('/api/admin/reviews');
    const j = await r.json();
    setRows((j.data ?? []) as ReviewRow[]);
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => rows.filter((review) => {
    const query = q.trim().toLowerCase();
    const matchesQuery = !query || `${review.product.name} ${review.user.fullName} ${review.title ?? ''} ${review.comment ?? ''}`.toLowerCase().includes(query);
    const matchesStatus = status === 'all' || (status === 'approved' ? review.isApproved : !review.isApproved);
    return matchesQuery && matchesStatus;
  }), [rows, q, status]);

  const counts = useMemo(() => ({ all: rows.length, pending: rows.filter((r) => !r.isApproved).length, approved: rows.filter((r) => r.isApproved).length }), [rows]);

  async function toggle(id: string, isApproved: boolean) {
    setBusy(id);
    const r = await fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ isApproved }) });
    if (r.ok) await load();
    setBusy(null);
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-border bg-card p-6"><p className="text-xs font-bold text-primary">کنترل کیفیت محتوا</p><h1 className="mt-1 text-2xl font-black">مدیریت و بررسی نظرها</h1><p className="mt-2 text-sm text-muted-foreground">نظرهای مشتریان را قبل از نمایش عمومی بررسی و مدیریت کنید.</p></header>
      <section className="grid gap-3 sm:grid-cols-3"><button type="button" onClick={() => setStatus('pending')} className={`rounded-2xl border p-4 text-start ${status === 'pending' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}><div className="text-xs text-muted-foreground">در انتظار بررسی</div><div className="mt-1 text-2xl font-black">{counts.pending.toLocaleString('fa-IR')}</div></button><button type="button" onClick={() => setStatus('approved')} className={`rounded-2xl border p-4 text-start ${status === 'approved' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}><div className="text-xs text-muted-foreground">تأییدشده</div><div className="mt-1 text-2xl font-black">{counts.approved.toLocaleString('fa-IR')}</div></button><button type="button" onClick={() => setStatus('all')} className={`rounded-2xl border p-4 text-start ${status === 'all' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}><div className="text-xs text-muted-foreground">همه نظرها</div><div className="mt-1 text-2xl font-black">{counts.all.toLocaleString('fa-IR')}</div></button></section>
      <section className="rounded-3xl border border-border bg-card p-4"><label className="flex items-center gap-2 rounded-xl border border-input bg-background px-3"><Search className="h-4 w-4 text-muted-foreground"/><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو بر اساس محصول، مشتری یا متن نظر…" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"/></label></section>
      <section className="space-y-3">{filtered.map((review) => <article key={review.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-bold">{review.product.name}</span><span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-700"><Star className="h-3 w-3 fill-current"/>{review.rating}/5</span></div><div className="mt-1 text-xs text-muted-foreground">نوشته‌شده توسط {review.user.fullName}</div>{review.title && <h3 className="mt-3 font-bold">{review.title}</h3>}{review.comment && <p className="mt-1 text-sm leading-7 text-muted-foreground">{review.comment}</p>}</div><div className="flex shrink-0 flex-wrap items-center gap-2">{review.isApproved ? <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700">تأییدشده</span> : <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700">در انتظار</span>}<button type="button" disabled={busy === review.id} onClick={() => void toggle(review.id, !review.isApproved)} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-50">{review.isApproved ? <><XCircle className="h-3.5 w-3.5"/> رد نظر</> : <><CheckCircle2 className="h-3.5 w-3.5"/> تأیید نظر</>}</button></div></div></article>)}{filtered.length === 0 && <div className="rounded-3xl border border-dashed border-border p-14 text-center text-sm text-muted-foreground">نظری مطابق فیلتر فعلی پیدا نشد.</div>}</section>
    </div>
  );
}
