'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, Plus, Trash2 } from 'lucide-react';

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

export default function HomepageBuilderPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [status, setStatus] = useState('');
  const [draft, setDraft] = useState({ key: 'featured-products', title: 'محصولات ویژه', subtitle: 'انتخاب‌های برتر Empire', type: 'products', sortOrder: 0, isActive: true, configJson: '{"limit":8}' });

  async function load() { const r = await fetch('/api/admin/homepage'); const j = await r.json(); setSections(j.data ?? []); }
  useEffect(() => { void load(); }, []);
  const sorted = useMemo(() => [...sections].sort((a, b) => a.sortOrder - b.sortOrder), [sections]);

  async function save() {
    setStatus('در حال ذخیره…');
    let config: Record<string, unknown>;
    try { config = JSON.parse(draft.configJson || '{}'); } catch { setStatus('تنظیمات JSON معتبر نیست.'); return; }
    const r = await fetch('/api/admin/homepage', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...draft, configJson: config }) });
    setStatus(r.ok ? 'بخش با موفقیت ذخیره شد.' : 'ذخیره بخش ناموفق بود.'); if (r.ok) await load();
  }

  async function remove(id: string) { if (!confirm('این بخش از صفحه اصلی حذف شود؟')) return; await fetch(`/api/admin/homepage?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); await load(); }

  async function move(section: Section, direction: -1 | 1) {
    const targetIndex = sorted.findIndex((item) => item.id === section.id) + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const target = sorted[targetIndex];
    const currentOrder = section.sortOrder;
    await Promise.all([
      fetch('/api/admin/homepage', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...section, sortOrder: target.sortOrder }) }),
      fetch('/api/admin/homepage', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...target, sortOrder: currentOrder }) }),
    ]);
    await load();
  }

  return <div className="space-y-6">
    <header className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold text-primary">مدیریت محتوای صفحه اصلی</p><h1 className="mt-1 text-2xl font-black">چینش صفحه اصلی</h1><p className="mt-2 text-sm text-muted-foreground">فقط ترتیب و وضعیت بخش‌های صفحه را مدیریت کنید؛ خودِ بنرها، تصاویر و زمان‌بندی آن‌ها فقط از «بنرها و کمپین‌ها» کنترل می‌شوند.</p></div><a href="/fa" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-bold hover:bg-muted"><Eye className="h-4 w-4" /> پیش‌نمایش سایت</a></header>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="rounded-3xl border border-border bg-card p-5"><div className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /><h2 className="text-lg font-black">افزودن بخش</h2></div><div className="mt-5 grid gap-4"><label><span className="mb-2 block text-sm font-semibold">کلید فنی</span><input value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">عنوان</span><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label><label><span className="mb-2 block text-sm font-semibold">نوع بخش</span><select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">{SECTION_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><label><span className="mb-2 block text-sm font-semibold">زیرعنوان</span><input value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">ترتیب نمایش</span><input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label><label className="flex items-end"><span className="flex h-11 w-full items-center gap-3 rounded-xl border border-input bg-background px-3 text-sm"><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} className="h-4 w-4" /> بخش فعال باشد</span></label></div><label><span className="mb-2 block text-sm font-semibold">تنظیمات پیشرفته</span><textarea value={draft.configJson} onChange={(e) => setDraft({ ...draft, configJson: e.target.value })} rows={7} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 font-mono text-xs" /><span className="mt-1 block text-xs text-muted-foreground">تنظیمات فنی این بخش؛ انتخاب/آپلود بنر اینجا انجام نمی‌شود.</span></label><button onClick={() => void save()} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">ذخیره بخش</button>{status && <p className="text-xs font-semibold text-muted-foreground">{status}</p>}</div></section>
      <section className="rounded-3xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black">چینش فعلی صفحه اصلی</h2><p className="mt-1 text-xs text-muted-foreground">هر بخش را با دکمه‌های بالا/پایین جابه‌جا کنید.</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">{sorted.length} بخش</span></div><div className="mt-5 space-y-3">{sorted.map((section, index) => <article key={section.id} className="rounded-2xl border border-border bg-background p-4"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">{index + 1}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-bold">{section.title || section.key}</span><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">{SECTION_TYPES.find(([value]) => value === section.type)?.[1] ?? 'بنر/قدیمی'}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${section.isActive ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{section.isActive ? 'فعال' : 'غیرفعال'}</span></div><div className="mt-1 text-xs text-muted-foreground">ترتیب {section.sortOrder} · کلید {section.key}</div></div><div className="flex shrink-0 items-center gap-1"><button type="button" aria-label="بالا بردن" onClick={() => void move(section, -1)} disabled={index === 0} className="rounded-lg border border-border p-2 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button><button type="button" aria-label="پایین بردن" onClick={() => void move(section, 1)} disabled={index === sorted.length - 1} className="rounded-lg border border-border p-2 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button><button type="button" aria-label="حذف" onClick={() => void remove(section.id)} className="rounded-lg border border-border p-2 text-destructive"><Trash2 className="h-4 w-4" /></button></div></div></article>)}{sorted.length === 0 && <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">هنوز بخشی برای صفحه اصلی تعریف نشده است.</div>}</div></section>
    </div>
  </div>;
}
