'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Eye, Megaphone, Plus, Trash2 } from 'lucide-react';

type Section = {
  id: string;
  key: string;
  title?: string | null;
  subtitle?: string | null;
  type: string;
  configJson: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
};

const SECTION_TYPES = [
  ['products', 'محصولات'],
  ['categories', 'دسته‌بندی‌ها'],
  ['stores', 'فروشگاه‌ها'],
  ['traditional', 'محصولات وطنی'],
  ['custom', 'سفارشی'],
] as const;

export default function HomepageBuilderPage({ params }: { params?: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState('fa');
  const [sections, setSections] = useState<Section[]>([]);
  const [status, setStatus] = useState('');
  const [draft, setDraft] = useState({
    key: 'featured-products',
    title: 'محصولات ویژه',
    subtitle: 'انتخاب‌های برتر Empire',
    type: 'products',
    sortOrder: 0,
    isActive: true,
    limit: 8,
  });

  useEffect(() => {
    if (params) void params.then((value) => setLocale(value.locale));
  }, [params]);

  async function load() {
    try {
      const r = await fetch('/api/admin/homepage', { cache: 'no-store' });
      const j = await r.json();
      setSections(j.data ?? []);
    } catch {
      setStatus('بارگذاری بخش‌های صفحه اصلی ناموفق بود.');
    }
  }

  useEffect(() => { void load(); }, []);

  const sorted = useMemo(() => [...sections].sort((a, b) => a.sortOrder - b.sortOrder), [sections]);

  async function save() {
    setStatus('در حال ذخیره…');
    const configJson = draft.type === 'products' ? { limit: Math.min(48, Math.max(1, Number(draft.limit) || 8)) } : {};
    try {
      const r = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: draft.key.trim(), title: draft.title.trim() || null, subtitle: draft.subtitle.trim() || null, type: draft.type, sortOrder: Math.max(0, Number(draft.sortOrder) || 0), isActive: draft.isActive, configJson }),
      });
      const j = await r.json().catch(() => null);
      setStatus(r.ok ? 'بخش با موفقیت ذخیره شد.' : (j?.error?.message ?? 'ذخیره بخش ناموفق بود.'));
      if (r.ok) await load();
    } catch {
      setStatus('ذخیره بخش ناموفق بود.');
    }
  }

  async function remove(id: string) {
    if (!confirm('این بخش از صفحه اصلی حذف شود؟')) return;
    await fetch(`/api/admin/homepage?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  async function move(section: Section, direction: -1 | 1) {
    const targetIndex = sorted.findIndex((item) => item.id === section.id) + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const target = sorted[targetIndex];
    await Promise.all([
      fetch('/api/admin/homepage', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: section.id, key: section.key, title: section.title, subtitle: section.subtitle, type: section.type, configJson: section.configJson, sortOrder: target.sortOrder, isActive: section.isActive }) }),
      fetch('/api/admin/homepage', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: target.id, key: target.key, title: target.title, subtitle: target.subtitle, type: target.type, configJson: target.configJson, sortOrder: section.sortOrder, isActive: target.isActive }) }),
    ]);
    await load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold text-primary">مدیریت محتوای صفحه اصلی</p>
          <h1 className="mt-1 text-2xl font-black">سازنده صفحه اصلی</h1>
          <p className="mt-2 text-sm text-muted-foreground">چینش و محتوای بخش‌های صفحه اصلی را بدون JSON و بدون دستکاری کد مدیریت کنید.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${locale}/admin/banners`} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-bold hover:bg-muted"><Megaphone className="h-4 w-4" /> مدیریت متمرکز بنرها</Link>
          <a href={`/${locale}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-bold hover:bg-muted"><Eye className="h-4 w-4" /> پیش‌نمایش سایت</a>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /><h2 className="text-lg font-black">افزودن بخش</h2></div>
          <div className="mt-5 grid gap-4">
            <label><span className="mb-2 block text-sm font-semibold">کلید فنی</span><input value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">عنوان</span><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label>
              <label><span className="mb-2 block text-sm font-semibold">نوع بخش</span><select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">{SECTION_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            <label><span className="mb-2 block text-sm font-semibold">زیرعنوان</span><input value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">ترتیب نمایش</span><input type="number" min={0} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label>
              {draft.type === 'products' ? <label><span className="mb-2 block text-sm font-semibold">تعداد محصولات</span><input type="number" min={1} max={48} value={draft.limit} onChange={(e) => setDraft({ ...draft, limit: Number(e.target.value) || 1 })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label> : <div className="flex items-end"><label className="flex h-11 w-full items-center gap-3 rounded-xl border border-input bg-background px-3 text-sm"><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} className="h-4 w-4" /> بخش فعال باشد</label></div>}
            </div>
            {draft.type === 'products' ? <label className="flex h-11 items-center gap-3 rounded-xl border border-input bg-background px-3 text-sm"><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} className="h-4 w-4" /> بخش فعال باشد</label> : null}
            <button onClick={() => void save()} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">ذخیره بخش</button>
            {status && <p className="text-xs font-semibold text-muted-foreground">{status}</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black">چینش فعلی صفحه اصلی</h2><p className="mt-1 text-xs text-muted-foreground">بنرها اینجا مدیریت نمی‌شوند و فقط در صفحه «بنرها» کنترل می‌شوند.</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">{sorted.length} بخش</span></div>
          <div className="mt-5 space-y-3">
            {sorted.map((section, index) => (
              <article key={section.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">{index + 1}</div>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-bold">{section.title || section.key}</span><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">{SECTION_TYPES.find(([value]) => value === section.type)?.[1] ?? section.type}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${section.isActive ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{section.isActive ? 'فعال' : 'غیرفعال'}</span></div><div className="mt-1 text-xs text-muted-foreground">ترتیب {section.sortOrder} · کلید {section.key}</div></div>
                  <div className="flex shrink-0 items-center gap-1"><button type="button" aria-label="بالا بردن" onClick={() => void move(section, -1)} disabled={index === 0} className="rounded-lg border border-border p-2 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button><button type="button" aria-label="پایین بردن" onClick={() => void move(section, 1)} disabled={index === sorted.length - 1} className="rounded-lg border border-border p-2 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button><button type="button" aria-label="حذف" onClick={() => void remove(section.id)} className="rounded-lg border border-border p-2 text-destructive"><Trash2 className="h-4 w-4" /></button></div>
                </div>
              </article>
            ))}
            {sorted.length === 0 && <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">هنوز بخشی برای صفحه اصلی تعریف نشده است.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}