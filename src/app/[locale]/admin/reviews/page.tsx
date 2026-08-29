'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Search, Star, XCircle } from 'lucide-react';

type ReviewRow = { id: string; product: { name: string }; user: { fullName: string }; rating: number; title: string | null; comment: string | null; isApproved: boolean };
type ReviewResponse = { items: ReviewRow[]; total: number; page: number; pageSize: number; counts: { all: number; pending: number; approved: number } };

export default function ReviewsPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved'>('pending');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ReviewResponse['counts']>({ all: 0, pending: 0, approved: 0 });
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(nextPage = page) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(nextPage), pageSize: '20', status, q });
      const r = await fetch(`/api/admin/reviews?${params.toString()}`, { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error?.message ?? 'بارگذاری نظرها ناموفق بود.');
      const data = j?.data as ReviewResponse;
      setRows(data.items ?? []);
      setTotal(data.total ?? 0);
      setMeta(data.counts ?? { all: 0, pending: 0, approved: 0 });
      setPage(data.page ?? nextPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'بارگذاری نظرها ناموفق بود.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(1); }, [status]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  async function toggle(id: string, isApproved: boolean) {
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ isApproved }) });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error?.message ?? 'تغییر وضعیت نظر ناموفق بود.');
      await load(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تغییر وضعیت نظر ناموفق بود.');
    } finally {
      setBusy(null);
    }
  }

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-6" dir="rtl">
      <header className="rounded-3xl border border-border bg-card p-6"><p className="text-xs font-bold text-primary">کنترل کیفیت محتوا</p><h1 className="mt-1 text-2xl font-black">مدیریت و بررسی نظرها</h1><p className="mt-2 text-sm text-muted-foreground">نظرهای مشتریان را قبل از نمایش عمومی بررسی و مدیریت کنید.</p></header>
      <section className="grid gap-3 sm:grid-cols-3">
        {([['pending','در انتظار بررسی',meta.pending],['approved','تأییدشده',meta.approved],['all','همه نظرها',meta.all]] as const).map(([key,label,count]) => <button key={key} type="button" onClick={() => { setStatus(key); setPage(1); }} className={`rounded-2xl border p-4 text-start ${status === key ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-black">{count.toLocaleString('fa-AF')}</div></button>)}
      </section>
      <section className="rounded-3xl border border-border bg-card p-4"><label className="flex items-center gap-2 rounded-xl border border-input bg-background px-3"><Search className="h-4 w-4 text-muted-foreground"/><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو بر اساس محصول، مشتری یا متن نظر…" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" /></label></section>
      {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <section className="space-y-3">
        {loading ? <div className="rounded-3xl border border-border bg-card p-14 text-center text-sm text-muted-foreground">در حال بارگذاری نظرها…</div> : rows.map((review) => <article key={review.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-bold">{review.product.name}</span><span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-700"><Star className="h-3 w-3 fill-current" />{review.rating}/5</span></div><div className="mt-1 text-xs text-muted-foreground">نوشته‌شده توسط {review.user.fullName}</div>{review.title && <h3 className="mt-3 font-bold">{review.title}</h3>}{review.comment && <p className="mt-1 text-sm leading-7 text-muted-foreground">{review.comment}</p>}</div><div className="flex shrink-0 flex-wrap items-center gap-2">{review.isApproved ? <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700">تأییدشده</span> : <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700">در انتظار</span>}<button type="button" disabled={busy === review.id} onClick={() => void toggle(review.id, !review.isApproved)} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-50">{review.isApproved ? <><XCircle className="h-3.5 w-3.5" /> مخفی‌کردن</> : <><CheckCircle2 className="h-3.5 w-3.5" /> تأیید</>}</button></div></div></article>)}
        {!loading && rows.length === 0 ? <div className="rounded-3xl border border-dashed border-border p-14 text-center text-sm text-muted-foreground">نظری مطابق فیلتر فعلی پیدا نشد.</div> : null}
      </section>
      {pages > 1 ? <nav className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3" aria-label="صفحه‌بندی نظرها"><button type="button" disabled={page <= 1 || loading} onClick={() => void load(page - 1)} className="rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-40">قبلی</button><span className="text-xs font-semibold text-muted-foreground">صفحه {page.toLocaleString('fa-AF')} از {pages.toLocaleString('fa-AF')}</span><button type="button" disabled={page >= pages || loading} onClick={() => void load(page + 1)} className="rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-40">بعدی</button></nav> : null}
    </div>
  );
}
