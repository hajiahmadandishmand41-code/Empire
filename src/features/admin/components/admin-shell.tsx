'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, Package, FolderTree, ShoppingBag, Users, Store, CreditCard,
  BarChart3, Wallet, Truck, Menu, LogOut, Bell, Home, X, ChevronRight,
  Shield, Sparkles, Megaphone, PanelsTopLeft, Images, Star, Search, UserCog,
  ClipboardList, PanelLeftClose, PanelLeftOpen, Command, ReceiptText, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

type NavGroupId = 'overview' | 'catalog' | 'commerce' | 'growth' | 'system';
type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; group: NavGroupId; keywords?: string };
type Group = { id: NavGroupId; label: string; items: NavItem[] };
type AdminShellProps = { locale: string; userName: string; children: React.ReactNode };

function NavLink({ item, active, collapsed, onClick }: { item: NavItem; active: boolean; collapsed: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onClick} aria-current={active ? 'page' : undefined} title={collapsed ? item.label : undefined}
      className={cn('group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors', collapsed && 'justify-center px-2', active ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/45 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white')}>
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', active ? 'bg-indigo-100 dark:bg-indigo-900/60' : 'bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-900 dark:group-hover:bg-slate-800')}>
        <Icon className={cn('h-4 w-4', active ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400')} aria-hidden="true" />
      </span>
      {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
      {!collapsed && active ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden="true" /> : null}
    </Link>
  );
}

function Sidebar({ groups, isActive, userName, locale, collapsed, onNavigate }: { groups: Group[]; isActive: (href: string) => boolean; userName: string; locale: string; collapsed: boolean; onNavigate?: () => void }) {
  const t = useTranslations('admin');
  const activeGroup = groups.find((group) => group.items.some((item) => isActive(item.href)))?.id ?? 'overview';
  const [openGroup, setOpenGroup] = React.useState<NavGroupId>(activeGroup);
  React.useEffect(() => { if (!collapsed) setOpenGroup(activeGroup); }, [activeGroup, collapsed]);

  return (
    <div className="flex h-full flex-col border-e border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className={cn('border-b border-slate-100 p-4 dark:border-slate-800', collapsed && 'px-2')}>
        <Link href={`/${locale}`} onClick={onNavigate} className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-lg shadow-indigo-500/20"><Shield className="h-5 w-5 text-white" aria-hidden="true" /></div>
          {!collapsed ? <div className="min-w-0"><p className="truncate text-sm font-black tracking-tight text-slate-950 dark:text-white">Empire</p><p className="mt-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-300">{t('brand')}</p></div> : null}
        </Link>
      </div>
      <div className={cn('border-b border-slate-100 dark:border-slate-800', collapsed ? 'p-2' : 'p-3')}>
        <div className={cn('rounded-2xl border border-indigo-100 bg-indigo-50/80 dark:border-indigo-900/50 dark:bg-indigo-950/30', collapsed ? 'p-2' : 'p-3')}>
          <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-xs font-black text-white ring-2 ring-indigo-200 dark:ring-indigo-900">{userName.charAt(0).toUpperCase()}</div>
            {!collapsed ? <div className="min-w-0"><p className="truncate text-xs font-black text-slate-900 dark:text-slate-100">{userName}</p><div className="mt-1 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" /><span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300">{t('role')}</span></div></div> : null}
          </div>
        </div>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 panel-scrollbar" aria-label="منوی مدیریت">
        {groups.map((group) => {
          const active = group.id === activeGroup;
          const open = !collapsed && openGroup === group.id;
          return <div key={group.id} className="mb-1">
            {!collapsed ? <button type="button" onClick={() => setOpenGroup((value) => value === group.id ? 'overview' : group.id)} className={cn('flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-[10px] font-black tracking-[0.08em] transition-colors', active ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-300')} aria-expanded={open}><span className="min-w-0 flex-1 truncate">{group.label}</span><ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} /></button> : <div className="py-1" aria-hidden="true" />}
            {open || collapsed ? <div className="space-y-0.5">{group.items.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} onClick={onNavigate} />)}</div> : null}
          </div>;
        })}
      </nav>
      <div className="space-y-1 border-t border-slate-100 p-2 dark:border-slate-800">
        <Link href={`/${locale}`} onClick={onNavigate} title={collapsed ? t('nav.backToSite') : undefined} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white', collapsed && 'justify-center px-2')}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900"><Home className="h-4 w-4" /></span>{!collapsed ? t('nav.backToSite') : null}</Link>
        <Link href="/api/auth/logout" onClick={onNavigate} title={collapsed ? t('nav.logout') : undefined} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30', collapsed && 'justify-center px-2')}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/30"><LogOut className="h-4 w-4" /></span>{!collapsed ? t('nav.logout') : null}</Link>
      </div>
    </div>
  );
}

function CommandPalette({ open, onClose, groups }: { open: boolean; onClose: () => void; groups: Group[] }) {
  const [query, setQuery] = React.useState('');
  React.useEffect(() => { if (open) setQuery(''); }, [open]);
  if (!open) return null;
  const normalized = query.trim().toLocaleLowerCase();
  const results = groups.flatMap((group) => group.items.filter((item) => `${item.label} ${item.href} ${item.keywords ?? ''}`.toLocaleLowerCase().includes(normalized)).map((item) => ({ group: group.label, item })));
  return <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/55 p-4 pt-[12vh] backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="جستجوی مدیریت" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800"><Search className="h-5 w-5 text-slate-400" /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجو در تمام بخش‌های پنل…" className="h-14 flex-1 bg-transparent text-sm outline-none" /><kbd className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-400 dark:border-slate-700 dark:bg-slate-900">Esc</kbd></div>
      <div className="max-h-[55vh] overflow-y-auto p-2">{results.length ? results.map(({ group, item }) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-slate-100 dark:hover:bg-slate-900"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900"><Icon className="h-4 w-4 text-slate-500" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{item.label}</span><span className="mt-0.5 block text-[10px] text-slate-400">{group}</span></span><ChevronRight className="h-4 w-4 text-slate-300 rtl:rotate-180" /></Link>; }) : <div className="px-5 py-12 text-center text-sm text-slate-400">نتیجه‌ای پیدا نشد.</div>}</div>
    </div>
  </div>;
}

export function AdminShell({ locale, userName, children }: AdminShellProps) {
  const pathname = usePathname();
  const t = useTranslations('admin');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const base = `/${locale}/admin`;
  const groups = React.useMemo<Group[]>(() => {
    const items: NavItem[] = [
      { href: base, label: t('nav.overview'), icon: LayoutDashboard, group: 'overview', keywords: 'dashboard overview' },
      { href: `${base}/products`, label: t('nav.products'), icon: Package, group: 'catalog', keywords: 'product catalog sku' },
      { href: `${base}/categories`, label: t('nav.categories'), icon: FolderTree, group: 'catalog', keywords: 'category taxonomy' },
      { href: `${base}/media`, label: 'کتابخانه رسانه', icon: Images, group: 'catalog', keywords: 'media upload image' },
      { href: `${base}/orders`, label: t('nav.orders'), icon: ShoppingBag, group: 'commerce', keywords: 'orders fulfillment' },
      { href: `${base}/shipping-methods`, label: t('nav.shipping'), icon: Truck, group: 'commerce', keywords: 'shipping delivery' },
      { href: `${base}/payments`, label: t('nav.payments'), icon: CreditCard, group: 'commerce', keywords: 'payments transaction' },
      { href: `${base}/payouts`, label: t('nav.payouts'), icon: Wallet, group: 'commerce', keywords: 'payout settlement' },
      { href: `${base}/banners`, label: 'بنرها و کمپین‌ها', icon: Megaphone, group: 'growth', keywords: 'banner campaign promotion' },
      { href: `${base}/homepage`, label: 'سازنده صفحه اصلی', icon: PanelsTopLeft, group: 'growth', keywords: 'homepage merchandising content' },
      { href: `${base}/marketplace`, label: 'پیشنهاد و Merchandising', icon: Sparkles, group: 'growth', keywords: 'recommendations ranking' },
      { href: `${base}/users`, label: t('nav.users'), icon: Users, group: 'growth', keywords: 'customers users' },
      { href: `${base}/sellers`, label: t('nav.sellers'), icon: Store, group: 'growth', keywords: 'sellers vendors' },
      { href: `${base}/reviews`, label: 'نظرات', icon: Star, group: 'growth', keywords: 'reviews ratings' },
      { href: `${base}/analytics`, label: 'تحلیل', icon: BarChart3, group: 'system', keywords: 'analytics metrics' },
      { href: `${base}/reports`, label: t('nav.reports'), icon: ReceiptText, group: 'system', keywords: 'reports exports' },
      { href: `${base}/search`, label: 'جستجو', icon: Search, group: 'system', keywords: 'search discovery' },
      { href: `${base}/notifications`, label: 'اعلان‌ها', icon: Bell, group: 'system', keywords: 'notifications alerts' },
      { href: `${base}/roles`, label: 'نقش‌ها و دسترسی‌ها', icon: UserCog, group: 'system', keywords: 'roles permissions rbac security' },
      { href: `${base}/audit`, label: 'حسابرسی', icon: ClipboardList, group: 'system', keywords: 'audit history logs' },
    ];
    const labels: Record<NavGroupId, string> = { overview: 'مرکز عملیات', catalog: 'کاتالوگ و رسانه', commerce: 'سفارش و مالی', growth: 'رشد و کاربران', system: 'تحلیل و سیستم' };
    return (Object.keys(labels) as NavGroupId[]).map((id) => ({ id, label: labels[id], items: items.filter((item) => item.group === id) }));
  }, [base, t]);
  const isActive = React.useCallback((href: string) => href === base ? pathname === base || pathname === `${base}/` : pathname === href || Boolean(pathname?.startsWith(`${href}/`)), [base, pathname]);
  const currentItem = groups.flatMap((group) => group.items).find((item) => isActive(item.href));

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(true); }
      if (event.key === 'Escape') { setCommandOpen(false); setMobileOpen(false); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
    <aside className={cn('hidden shrink-0 md:flex md:flex-col', collapsed ? 'w-[78px]' : 'w-[272px]')}><Sidebar groups={groups} isActive={isActive} userName={userName} locale={locale} collapsed={collapsed} /></aside>
    {mobileOpen ? <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="منوی مدیریت"><div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setMobileOpen(false)} /><aside className="absolute inset-y-0 start-0 w-[292px] shadow-2xl"><Sidebar groups={groups} isActive={isActive} userName={userName} locale={locale} collapsed={false} onNavigate={() => setMobileOpen(false)} /></aside><button type="button" onClick={() => setMobileOpen(false)} aria-label="بستن منو" className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white"><X className="h-4 w-4" /></button></div> : null}
    <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} groups={groups} />
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 sm:px-5">
        <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 md:hidden" aria-label="باز کردن منوی مدیریت" onClick={() => setMobileOpen(true)}><Menu className="h-4 w-4" /></button>
        <button type="button" className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 md:inline-flex" aria-label={collapsed ? 'باز کردن نوار کناری' : 'جمع کردن نوار کناری'} onClick={() => setCollapsed((value) => !value)}>{collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</button>
        <button type="button" onClick={() => setCommandOpen(true)} className="flex min-w-0 flex-1 items-center gap-2 text-start sm:max-w-xl"><div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900/60"><Command className="h-4 w-4 shrink-0" /><span className="truncate">جستجوی سریع در کل پنل…</span><kbd className="ms-auto hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-700 dark:bg-slate-900 sm:block">Ctrl K</kbd></div></button>
        <div className="ms-auto flex items-center gap-1.5"><div className="hidden min-w-0 sm:block"><div className="truncate text-xs font-black">{currentItem?.label ?? 'مرکز عملیات Empire'}</div><div className="text-[10px] text-slate-400">Commerce Admin</div></div><ThemeToggle variant="icon" lang="fa" /><Link href={`${base}/notifications`} className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900" aria-label="اعلان‌ها"><Bell className="h-4 w-4" /><span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" /></Link></div>
      </header>
      <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
    </div>
  </div>;
}
