'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, Package, FolderTree, ShoppingBag, Users,
  Store, CreditCard, BarChart3, Wallet, Truck, Menu,
  LogOut, Bell, Settings, Home, X, ChevronRight, Shield, Sparkles,
  Megaphone, PanelsTopLeft, Images, Star, Search, UserCog, ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavItem { href: string; label: string; icon: React.ComponentType<{ className?: string }>; group: 'main' | 'management' | 'finance' | 'system'; }
interface AdminShellProps { locale: string; userName: string; children: React.ReactNode; }

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return <Link href={item.href} onClick={onClick} aria-current={active ? 'page' : undefined} className={cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150', active ? 'bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-950/40 dark:text-indigo-400' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-100')}><span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors', active ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700')}><Icon className={cn('h-3.5 w-3.5', active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400')} aria-hidden="true" /></span><span className="flex-1 leading-tight">{item.label}</span></Link>;
}
function NavGroup({ label, children }: { label: string; children: React.ReactNode }) { return <div className="mb-1"><p className="px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">{label}</p><div className="space-y-0.5">{children}</div></div>; }

function SidebarContent({ items, isActive, userName, locale, onNavigate }: { items: NavItem[]; isActive: (href: string) => boolean; userName: string; locale: string; onNavigate?: () => void }) {
  const t = useTranslations('admin');
  const mainItems = items.filter((i) => i.group === 'main'); const mgmtItems = items.filter((i) => i.group === 'management'); const financeItems = items.filter((i) => i.group === 'finance'); const systemItems = items.filter((i) => i.group === 'system');
  return <div className="flex h-full flex-col border-e border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
    <div className="border-b border-gray-100 px-4 py-4 dark:border-gray-800/80"><Link href={`/${locale}`} onClick={onNavigate} className="group flex items-center gap-2.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/25 transition-transform group-hover:scale-105"><Shield className="h-5 w-5 text-white" aria-hidden /></div><div className="flex flex-col"><p className="text-sm font-extrabold leading-none tracking-tight text-gray-900 dark:text-white">Eshop</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">{t('brand')}</p></div></Link></div>
    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800/80"><div className="flex items-center gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5 dark:border-indigo-900/40 dark:bg-indigo-950/30"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-xs font-bold text-white shadow-sm ring-2 ring-indigo-200 dark:ring-indigo-800">{userName.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-xs font-bold text-gray-900 dark:text-gray-100">{userName}</p><div className="mt-0.5 flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden /><p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">{t('role')}</p></div></div></div></div>
    <nav className="flex-1 overflow-y-auto px-3 py-2 panel-scrollbar" aria-label={t('brand')}><NavGroup label={t('groups.main')}>{mainItems.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />)}</NavGroup>{mgmtItems.length > 0 && <NavGroup label={t('groups.management')}>{mgmtItems.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />)}</NavGroup>}{financeItems.length > 0 && <NavGroup label={t('groups.finance')}>{financeItems.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />)}</NavGroup>}{systemItems.length > 0 && <NavGroup label={locale === 'en' ? 'System' : 'سیستم'}>{systemItems.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />)}</NavGroup>}</nav>
    <div className="space-y-0.5 border-t border-gray-100 px-3 py-3 dark:border-gray-800/80"><Link href={`/${locale}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-100"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800"><Home className="h-3.5 w-3.5" aria-hidden /></span>{t('nav.backToSite')}</Link><Link href="/api/auth/logout" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30"><LogOut className="h-3.5 w-3.5" aria-hidden /></span>{t('nav.logout')}</Link></div>
  </div>;
}

export function AdminShell({ locale, userName, children }: AdminShellProps) {
  const pathname = usePathname(); const [mobileOpen, setMobileOpen] = React.useState(false); const t = useTranslations('admin'); const base = `/${locale}/admin`;
  const items: NavItem[] = [
    { href: base, label: t('nav.overview'), icon: LayoutDashboard, group: 'main' },
    { href: `${base}/products`, label: t('nav.products'), icon: Package, group: 'main' },
    { href: `${base}/categories`, label: t('nav.categories'), icon: FolderTree, group: 'main' },
    { href: `${base}/orders`, label: t('nav.orders'), icon: ShoppingBag, group: 'main' },
    { href: `${base}/marketplace`, label: locale === 'en' ? 'Marketplace' : 'Marketplace Eshop', icon: Sparkles, group: 'management' },
    { href: `${base}/sellers`, label: t('nav.sellers'), icon: Store, group: 'management' },
    { href: `${base}/users`, label: t('nav.users'), icon: Users, group: 'management' },
    { href: `${base}/banners`, label: locale === 'en' ? 'Banners' : 'بنرها', icon: Megaphone, group: 'management' },
    { href: `${base}/homepage`, label: locale === 'en' ? 'Homepage Builder' : 'سازنده صفحه اصلی', icon: PanelsTopLeft, group: 'management' },
    { href: `${base}/reviews`, label: locale === 'en' ? 'Reviews' : 'نظرات', icon: Star, group: 'management' },
    { href: `${base}/media`, label: locale === 'en' ? 'Media Library' : 'رسانه‌ها', icon: Images, group: 'management' },
    { href: `${base}/search`, label: locale === 'en' ? 'Search Management' : 'مدیریت جستجو', icon: Search, group: 'management' },
    { href: `${base}/shipping-methods`, label: t('nav.shipping'), icon: Truck, group: 'finance' },
    { href: `${base}/payments`, label: t('nav.payments'), icon: CreditCard, group: 'finance' },
    { href: `${base}/payouts`, label: t('nav.payouts'), icon: Wallet, group: 'finance' },
    { href: `${base}/reports`, label: t('nav.reports'), icon: BarChart3, group: 'finance' },
    { href: `${base}/analytics`, label: locale === 'en' ? 'Analytics Center' : 'مرکز تحلیل', icon: BarChart3, group: 'finance' },
    { href: `${base}/notifications`, label: locale === 'en' ? 'Notifications' : 'اعلان‌ها', icon: Bell, group: 'system' },
    { href: `${base}/roles`, label: locale === 'en' ? 'Roles & Permissions' : 'نقش‌ها و دسترسی‌ها', icon: UserCog, group: 'system' },
    { href: `${base}/audit`, label: locale === 'en' ? 'Audit Log' : 'لاگ حسابرسی', icon: ClipboardList, group: 'system' },
  ];
  const isActive = (href: string) => href === base ? pathname === base || pathname === `${base}/` : pathname === href || Boolean(pathname?.startsWith(`${href}/`)); const currentItem = items.find((i) => isActive(i.href));
  const sidebar = <SidebarContent items={items} isActive={isActive} userName={userName} locale={locale} onNavigate={() => setMobileOpen(false)} />;
  return <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950"><aside className="hidden w-[256px] shrink-0 shadow-sm md:flex md:flex-col"><SidebarContent items={items} isActive={isActive} userName={userName} locale={locale} /></aside>{mobileOpen && <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} /><aside className="absolute inset-y-0 start-0 w-[256px] shadow-2xl">{sidebar}</aside><button onClick={() => setMobileOpen(false)} aria-label={t('actions.cancel')} className="absolute end-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white"><X className="h-4 w-4" /></button></div>}<div className="flex min-w-0 flex-1 flex-col"><header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white/95 px-4 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/95"><button className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400 md:hidden" aria-label={t('brand')} onClick={() => setMobileOpen(true)}><Menu className="h-4 w-4" /></button><div className="flex min-w-0 items-center gap-2 text-sm"><div className="flex items-center gap-1.5"><Shield className="h-4 w-4 shrink-0 text-indigo-500" aria-hidden /><span className="hidden font-bold text-gray-900 dark:text-gray-100 sm:block">Eshop</span></div>{currentItem && <><ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600 sm:block rtl:rotate-180" aria-hidden /><span className="truncate text-gray-500 dark:text-gray-400">{currentItem.label}</span></>}</div><div className="flex-1" /><div className="flex items-center gap-1.5"><ThemeToggle variant="icon" lang={locale} /><button className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400" aria-label="Notifications"><Bell className="h-4 w-4" aria-hidden /><span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" aria-hidden /></button><Link href={`${base}/notifications`} className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400" aria-label={locale === 'en' ? 'Notifications' : 'اعلان‌ها'}><Bell className="h-4 w-4" aria-hidden /></Link><Link href={`${base}/roles`} className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400" aria-label={locale === 'en' ? 'Roles' : 'نقش‌ها'}><Settings className="h-4 w-4" aria-hidden /></Link></div></header><main id="main" className="flex-1 p-4 sm:p-6">{children}</main></div></div>;
}
