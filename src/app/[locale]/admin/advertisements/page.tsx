'use client';

import { useEffect, useState } from 'react';
import { ImagePlus, Save, Trash2, Eye, EyeOff, Sparkles } from 'lucide-react';

interface Ad {
  id: string; titleFa: string; titlePs: string; titleEn: string;
  subtitleFa: string; subtitlePs: string; subtitleEn: string;
  imageUrl: string; href: string; isActive: boolean; sortOrder: number;
  startsAt: string | null; endsAt: string | null;
}

const emptyAd = (): Omit<Ad, 'id'> => ({ titleFa: 'پیشنهاد ویژه امروز', titlePs: 'د نن ورځې ځانګړی وړاندیز', titleEn: 'Today’s special offer', subtitleFa: 'تخفیف ویژه روی محصولات منتخب', subtitlePs: 'په غوره محصولاتو ځانګړی تخفیف', subtitleEn: 'Special discount on selected products', imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=85', href: '/shop?sort=popular', isActive: true, sortOrder: 1, startsAt: null, endsAt: null });

export default function AdvertisementsPage() {
  const [items, setItems] = useState<Ad[]>([]);
  const [form, setForm] = useState(() => ({ id: '', ...emptyAd() }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/homepage/advertisements', { cache: 'no-store' });
      const body = await response.json();
      setItems(body?.data ?? []);
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function edit(item: Ad) { setForm(item); setMessage(''); }

  async function save() {
    setSaving(true); setMessage('');
    try {
      const method = form.id ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/homepage/advertisements', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? 'save_failed');
      setMessage('ذخیره شد / Saved / خوندي شو');
      setForm({ id: '', ...emptyAd() });
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'خطا در ذخیره'); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm('این تبلیغ حذف شود؟')) return;
    await fetch(`/api/admin/homepage/advertisements?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (form.id === id) setForm({ id: '', ...emptyAd() });
    await load();
  }

  const set = (key: keyof typeof form, value: unknown) => setForm((current) => ({ ...current, [key]: value }));

  return <div className="mx-auto max-w-6xl space-y-6">
    <header><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-indigo-500" /><h1 className="text-2xl font-black text-gray-900 dark:text-white">تبلیغات صفحه اول</h1></div><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">بنر متحرک زیر نوار جستجو را از اینجا مدیریت و فعال کنید.</p></header>
    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">تبلیغ‌ها</h2><span className="text-xs text-gray-400">{loading ? '…' : `${items.length} مورد`}</span></div>
        <div className="space-y-3">
          {items.map((item) => <article key={item.id} className="rounded-2xl border border-gray-200 p-3 dark:border-gray-800"><div className="flex gap-3"><div className="h-20 w-28 shrink-0 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${item.imageUrl})` }} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate text-sm font-bold">{item.titleFa}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{item.isActive ? 'فعال' : 'خاموش'}</span></div><p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.subtitleFa || '—'}</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => edit(item)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50">ویرایش</button><button type="button" onClick={() => remove(item.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3" />حذف</button></div></div></div></article>)}
          {!loading && items.length === 0 && <p className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">هنوز تبلیغی ثبت نشده.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">{form.id ? 'ویرایش تبلیغ' : 'تبلیغ جدید'}</h2><p className="mt-1 text-xs text-gray-400">تمام سه زبان را وارد کنید.</p></div><button type="button" onClick={() => setForm({ id: '', ...emptyAd() })} className="text-xs font-semibold text-indigo-600">جدید</button></div>
        <div className="space-y-3">
          {([['titleFa','عنوان دری'],['titlePs','عنوان پشتو'],['titleEn','عنوان انگلیسی'],['subtitleFa','زیرعنوان دری'],['subtitlePs','زیرعنوان پشتو'],['subtitleEn','زیرعنوان انگلیسی'],['imageUrl','آدرس عکس'],['href','لینک'],['sortOrder','ترتیب']] as const).map(([key,label]) => <label key={key} className="block"><span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</span><input value={String(form[key] ?? '')} onChange={(e) => set(key, key === 'sortOrder' ? Number(e.target.value) : e.target.value)} className="h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-indigo-400 dark:border-gray-800" /></label>)}
          <label className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2.5 dark:border-gray-800"><span className="text-xs font-semibold">نمایش در صفحه اول</span><button type="button" onClick={() => set('isActive', !form.isActive)} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold ${form.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{form.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{form.isActive ? 'فعال' : 'خاموش'}</button></label>
          <div className="rounded-2xl border border-dashed border-gray-200 p-3 dark:border-gray-800"><div className="flex items-center gap-2 text-xs font-bold"><ImagePlus className="h-4 w-4 text-indigo-500" />پیش‌نمایش</div><div className="mt-3 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white"><div className="text-lg font-black">{form.titleFa}</div><div className="mt-1 text-xs text-white/80">{form.subtitleFa}</div></div></div>
          {message && <p className="text-xs font-semibold text-indigo-600">{message}</p>}
          <button type="button" disabled={saving} onClick={save} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'در حال ذخیره…' : 'ذخیره تبلیغ'}</button>
        </div>
      </section>
    </div>
  </div>;
}
