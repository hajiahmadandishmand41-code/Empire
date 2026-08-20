'use client';
import { useEffect, useMemo, useState } from 'react';

type RoleKey = 'super_admin' | 'admin' | 'moderator' | 'support';
type RoleRow = { id: string; fullName: string; email: string | null; role: string; accessRole: RoleKey; permissionsJson?: string[] };

const ROLE_LABEL: Record<RoleKey, string> = {
  super_admin: 'مدیر ارشد',
  admin: 'مدیر',
  moderator: 'ناظر',
  support: 'پشتیبانی',
};
const ROLE_DESC: Record<RoleKey, string> = {
  super_admin: 'دسترسی کامل به همه بخش‌ها',
  admin: 'مدیریت عملیات اصلی Marketplace',
  moderator: 'محتوا، محصولات و نظارت',
  support: 'سفارش‌ها، کاربران و پشتیبانی',
};
const GROUPS: Array<{ key: string; label: string; prefixes: string[] }> = [
  { key: 'core', label: 'هسته و داشبورد', prefixes: ['dashboard.'] },
  { key: 'catalog', label: 'محصولات و دسته‌بندی', prefixes: ['products.', 'categories.'] },
  { key: 'commerce', label: 'سفارش و فروشندگان', prefixes: ['orders.', 'sellers.'] },
  { key: 'users', label: 'کاربران', prefixes: ['users.'] },
  { key: 'content', label: 'محتوا و رسانه', prefixes: ['banners.', 'homepage.', 'recommendations.', 'reviews.', 'media.', 'search.'] },
  { key: 'system', label: 'سیستم و نظارت', prefixes: ['notifications.', 'audit.', 'analytics.'] },
];

export default function RolesPage() {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<RoleKey>('admin');
  const [query, setQuery] = useState('');

  async function load() {
    const r = await fetch('/api/admin/roles');
    const j = await r.json();
    setRows((j.data ?? []) as RoleRow[]);
  }
  useEffect(() => { void load(); }, []);

  async function save(userId: string, accessRole: RoleKey) {
    setStatus('در حال ذخیره…');
    const r = await fetch('/api/admin/roles', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, accessRole }),
    });
    setStatus(r.ok ? 'ذخیره شد' : 'ذخیره ناموفق بود');
    if (r.ok) await load();
  }

  const filtered = useMemo(() => rows.filter((r) => {
    const needle = query.trim().toLowerCase();
    return !needle || `${r.fullName} ${r.email ?? ''}`.toLowerCase().includes(needle);
  }), [rows, query]);
  const selectedPerms = rows.find((r) => r.accessRole === selected)?.permissionsJson ?? [];
  const permissionCount = selected === 'super_admin' ? 'نامحدود' : selectedPerms.length || 'بر اساس الگوی نقش';
  const enabledGroups = GROUPS.filter((group) => selected === 'super_admin' || group.prefixes.some((prefix) => selectedPerms.some((p) => p.startsWith(prefix))));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-foreground">نقش‌ها و دسترسی‌ها</h1>
        <p className="mt-1 text-sm text-muted-foreground">مدیریت دسترسی‌های واقعی Admin در Backend؛ پنهان‌کردن منو به‌تنهایی مجوز محسوب نمی‌شود.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(ROLE_LABEL) as RoleKey[]).map((role) => (
          <button key={role} type="button" onClick={() => setSelected(role)} className={`rounded-2xl border p-4 text-start transition ${selected === role ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:bg-muted/30'}`}>
            <div className="flex items-center justify-between gap-3"><span className="font-bold">{ROLE_LABEL[role]}</span><span className="text-xs text-muted-foreground">{rows.filter((r) => r.accessRole === role).length} نفر</span></div>
            <p className="mt-1 text-xs text-muted-foreground">{ROLE_DESC[role]}</p>
          </button>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-lg font-bold">اعضای مدیریتی</h2><p className="mt-1 text-xs text-muted-foreground">تغییر نقش هر کاربر از همین صفحه انجام می‌شود.</p></div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی نام یا ایمیل…" className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm sm:max-w-xs" />
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-sm"><thead className="bg-muted/40"><tr><th className="px-3 py-3 text-start">نام</th><th className="px-3 py-3 text-start">ایمیل</th><th className="px-3 py-3 text-start">نقش پایه</th><th className="px-3 py-3 text-start">سطح دسترسی</th><th className="px-3 py-3 text-start">عملیات</th></tr></thead>
              <tbody className="divide-y divide-border">{filtered.map((r) => <tr key={r.id}><td className="px-3 py-3 font-medium">{r.fullName}</td><td className="px-3 py-3 text-muted-foreground">{r.email ?? '—'}</td><td className="px-3 py-3 text-xs">{r.role === 'admin' ? 'مدیر سیستم' : r.role}</td><td className="px-3 py-3"><select value={r.accessRole} onChange={(e) => setRows((xs) => xs.map((x) => x.id === r.id ? { ...x, accessRole: e.target.value as RoleKey } : x))} className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs">{(Object.keys(ROLE_LABEL) as RoleKey[]).map((role) => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}</select></td><td className="px-3 py-3"><button type="button" onClick={() => void save(r.id, r.accessRole)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">ذخیره</button></td></tr>)}</tbody>
            </table>{filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">مدیر یا نتیجه‌ای یافت نشد.</div>}
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">جزئیات نقش {ROLE_LABEL[selected]}</h2><p className="mt-1 text-xs text-muted-foreground">{ROLE_DESC[selected]}</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{permissionCount} دسترسی</span></div>
          <div className="mt-5 space-y-2">{enabledGroups.map((group) => <div key={group.key} className="rounded-xl border border-border bg-muted/20 p-3"><div className="font-semibold text-sm">{group.label}</div><div className="mt-1 text-xs text-muted-foreground">{selected === 'super_admin' ? 'دسترسی کامل' : 'دسترسی‌های این گروه فعال است'}</div></div>)}</div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">مدیر ارشد را فقط برای حساب‌های مورداعتماد استفاده کنید. تغییر نقش از طریق API محافظت‌شده انجام می‌شود.</div>
          {status && <p className="mt-3 text-xs text-muted-foreground">{status}</p>}
        </aside>
      </section>
    </div>
  );
}
