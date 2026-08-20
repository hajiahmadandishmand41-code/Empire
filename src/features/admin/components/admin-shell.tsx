'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, Package, FolderTree, ShoppingBag, Users, Store, CreditCard,
  BarChart3, Wallet, Truck, Menu, LogOut, Bell, Home, X, ChevronRight, Shield,
  Sparkles, Megaphone, PanelsTopLeft, Images, Star, Search, UserCog, ClipboardList,
  Settings, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavItem { href: string; label: string; icon: React.ComponentType<{ className?: string }>; group: 'main' | 'management' | 'finance' | 'system'; }
interface AdminShellProps { locale: string; userName: string; children: React.ReactNode; }

function NavLink({ item, active, collapsed, onClick }: { item: NavItem; active: boolean; collapsed: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onClick} aria-current={active ? 'page' : undefined} title={collapsed ? item.label : undefined}
      className={cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150', collapsed && 'justify-center px-2', active ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100 dark:bg-indigo-950/45 dark:text-indigo-300 dark:ring-indigo-900/50' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white')}>
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', active ? 'bg-indigo-100 dark:bg-indigo-900/60' : 'bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-900 dark:group-hover:bg-slate-800')}><Icon className={cn('h-4 w-4', active ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400')} aria-hidden="true" /></span>
      {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
      {!collapsed && active ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden="true" /> : null}
    </Link>
  );
}

function NavGroup({ label, collapsed, children }: { label: string; collapsed: boolean; children: React.ReactNode }) {
  return <div className="mb-2">{!collapsed ? <p className="px-3 pb-2 pt-4 text-[10px] font-black tracking-[0.16em] text-slate-400 dark:text-slate-600">{label}</p> : <div className="py-2" aria-hidden="true" />}<div className="space-y-1">{children}</div></div>;
}

function SidebarContent({ items, isActive, userName, locale, collapsed, onNavigate }: { items: NavItem[]; isActive: (href: string) => boolean; userName: string; locale: string; collapsed: boolean; onNavigate?: () => void }) {
  const t = useTranslations('admin');
  const groups = {
    main: items.filter((item) => item.group === 'main'),
    management: items.filter((item) => item.group === 'management'),
    finance: items.filter((item) => item.group === 'finance'),
    system: items.filter((item) => item.group === 'system'),
  };
  return (
    <div className="flex h-full flex-col border-e border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className={cn('border-b border-slate-100 p-4 dark:border-slate-800', collapsed && 'px-2')}>
        <Link href={`/${locale}`} onClick={onNavigate} className={cn('group flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-lg shadow-indigo-500/20"><Shield className="h-5 w-5 text-white" aria-hidden="true" /></div>
          {!collapsed ? <div className="min-w-0"><p className="truncate text-sm font-black tracking-tight text-slate-950 dark:text-white">Empire</p><p className="mt-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-300">{t('brand')}</p></div> : null}
        </Link>
      </div>
      <div className={cn('border-b border-slate-100 dark:border-slate-800', collapsed ? 'p-2' : 'p-3')}><div className={cn('rounded-2xl border border-indigo-100 bg-indigo-50/80 dark:border-indigo-900/50 dark:bg-indigo-950/30', collapsed ? 'p-2' : 'p-3')}><div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-xs font-black text-white ring-2 ring-indigo-200 dark:ring-indigo-900">{userName.charAt(0).toUpperCase()}</div>{!collapsed ? <div className="min-w-0"><p className="truncate text-xs font-black text-slate-900 dark:text-slate-100">{userName}</p><div className="mt-1 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" /><span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300">{t('role')}</span></div></div> : null}</div></div></div>
      <nav className="flex-1 overflow-y-auto px-2 pb-2 panel-scrollbar" aria-label="منوی مدیریت">
        <NavGroup label={t('groups.main')} collapsed={collapsed}>{groups.main.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} onClick={onNavigate} />)}</NavGroup>
        <NavGroup label={t('groups.management')} collapsed={collapsed}>{groups.management.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} onClick={onNavigate} />)}</NavGroup>
        <NavGroup label={t('groups.finance')} collapsed={collapsed}>{groups.finance.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} onClick={onNavigate} />)}</NavGroup>
        <NavGroup label="سیستم و امنیت" collapsed={collapsed}>{groups.system.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} onClick={onNavigate} />)}</NavGroup>
      </nav>
      <div className="space-y-1 border-t border-slate-100 p-2 dark:border-slate-800"><Link href={`/${locale}`} onClick={onNavigate} title={collapsed ? t('nav.backToSite') : undefined} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white', collapsed && 'justify-center px-2')}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900"><Home className="h-4 w-4" aria-hidden="true" /></span>{!collapsed ? t('nav.backToSite') : null}</Link><Link href="/api/auth/logout" onClick={onNavigate} title={collapsed ? t('nav.logout') : undefined} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30', collapsed && 'justify-center px-2')}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/30"><LogOut className="h-4 w-4" aria-hidden="true" /></span>{!collapsed ? t('nav.logout') : null}</Link></div>
    </div>
  );
}

export function AdminShell({ locale, userName, children }: AdminShellProps) {
  const pathname = usePathname();
  const t = useTranslations('admin');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const base = `/${locale}/admin`;
  const items: NavItem[] = [
    { href: base, label: t('nav.overview'), icon: LayoutDashboard, group: 'main' },
    { href: `${base}/products`, label: t('nav.products'), icon: Package, group: 'main' },
    { href: `${base}/categories`, label: t('nav.categories'), icon: FolderTree, group: 'main' },
    { href: `${base}/orders`, label: t('nav.orders'), icon: ShoppingBag, group: 'main' },
    { href: `${base}/marketplace`, label: 'مرکز بازار', icon: Sparkles, group: 'management' },
    { href: `${base}/sellers`, label: t('nav.sellers'), icon: Store, group: 'management' },
    { href: `${base}/users`, label: t('nav.users'), icon: Users, group: 'management' },
    { href: `${base}/banners`, label: 'بنرها و کمپین‌ها', icon: Megaphone, group: 'management' },
    { href: `${base}/homepage`, label: 'سازنده صفحه اصلی', icon: PanelsTopLeft, group: 'management' },
    { href: `${base}/reviews`, label: 'مدیریت نظرات', icon: Star, group: 'management' },
    { href: `${base}/media`, label: 'کتابخانه رسانه', icon: Images, group: 'management' },
    { href: `${base}/search`, label: 'مدیریت جستجو', icon: Search, group: 'management' },
    { href: `${base}/shipping-methods`, label: t('nav.shipping'), icon: Truck, group: 'finance' },
    { href: `${base}/payments`, label: t('nav.payments'), icon: CreditCard, group: 'finance' },
    { href: `${base}/payouts`, label: t('nav.payouts'), icon: Wallet, group: 'finance' },
    { href: `${base}/reports`, label: t('nav.reports'), icon: BarChart3, group: 'finance' },
    { href: `${base}/analytics`, label: 'مرکز تحلیل', icon: BarChart3, group: 'finance' },
    { href: `${base}/notifications`, label: 'اعلان‌ها', icon: Bell, group: 'system' },
    { href: `${base}/roles`, label: 'نقش‌ها و دسترسی‌ها', icon: UserCog, group: 'system' },
    { href: `${base}/audit`, label: 'گزارش حسابرسی', icon: ClipboardList, group: 'system' },
  ];
  const isActive = (href: string) => href === base ? pathname === base || pathname === `${base}/` : pathname === href || Boolean(pathname?.startsWith(`${href}/`));
  const currentItem = items.find((item) => isActive(item.href));
  const mobileSidebar = <SidebarContent items={items} isActive={isActive} userName={userName} locale={locale} collapsed={false} onNavigate={() => setMobileOpen(false)} />;
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className={cn('hidden shrink-0 transition-[width] duration-200 md:flex md:flex-col', collapsed ? 'w-[78px]' : 'w-[272px]')}><SidebarContent items={items} isActive={isActive} userName={userName} locale={locale} collapsed={collapsed} /></aside>
      {mobileOpen ? <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="منوی مدیریت"><div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setMobileOpen(false)} /><aside className="absolute inset-y-0 start-0 w-[292px] shadow-2xl">{mobileSidebar}</aside><button type="button" onClick={() => setMobileOpen(false)} aria-label="بستن منو" className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur"><X className="h-4 w-4" /></button></div> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 sm:px-5">
          <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 md:hidden" aria-label="باز کردن منوی مدیریت" onClick={() => setMobileOpen(true)}><Menu className="h-4 w-4" /></button>
          <button type="button" className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 md:inline-flex" aria-label={collapsed ? 'باز کردن نوار کناری' : 'جمع کردن نوار کناری'} onClick={() => setCollapsed((value) => !value)}>{collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</button>
          <div className="flex min-w-0 items-center gap-2"><Shield className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" /><span className="hidden font-black text-slate-950 dark:text-white sm:block">مدیریت Empire</span>{currentItem ? <><ChevronRight className="h-4 w-4 shrink-0 text-slate-300 rtl:rotate-180" aria-hidden="true" /><span className="truncate text-sm font-semibold text-slate-500 dark:text-slate-400">{currentItem.label}</span></> : null}</div>
          <div className="mx-auto hidden w-full max-w-xl items-center gap-2 md:flex"><div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900/60"><Search className="h-4 w-4 shrink-0" aria-hidden="true" /><span>جستجوی سریع در پنل مدیریت...</span><kbd className="ms-auto rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-700 dark:bg-slate-900">Ctrl K</kbd></div></div>
          <div className="ms-auto flex items-center gap-1.5"><ThemeToggle variant="icon" lang="fa" /><Link href={`${base}/notifications`} className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" aria-label="اعلان‌ها"><Bell className="h-4 w-4" aria-hidden="true" /><span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" /></Link><Link href={`${base}/roles`} className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:flex" aria-label="نقش‌ها و دسترسی‌ها"><Settings className="h-4 w-4" aria-hidden="true" /></Link><Link href={`/${locale}`} className="hidden h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:flex"><Home className="h-4 w-4" aria-hidden="true" /> سایت</Link></div>
        </header>
        <main id="main" className="flex-1 p-4 sm:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
