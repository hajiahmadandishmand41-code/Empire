'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, FolderTree, ShoppingBag, Users,
  Store, CreditCard, BarChart3, Wallet, Truck, Menu,
  LogOut, Bell, Settings, Home, X, ChevronRight, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmpireLogo } from '@/components/empire-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  group?: string;
}

interface AdminShellProps {
  locale: string;
  userName: string;
  children: React.ReactNode;
}

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
        active
          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-100',
      )}
    >
      <div className={cn(
        'flex h-7 w-7 items-center justify-center rounded-lg transition-colors flex-shrink-0',
        active
          ? 'bg-indigo-100 dark:bg-indigo-900/50'
          : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700',
      )}>
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400',
          )}
          aria-hidden="true"
        />
      </div>
      <span className="flex-1 leading-tight">{item.label}</span>
      {item.badge !== undefined && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-sm">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarContent({
  items,
  isActive,
  userName,
  locale,
  onNavigate,
}: {
  items: NavItem[];
  isActive: (href: string) => boolean;
  userName: string;
  locale: string;
  onNavigate?: () => void;
}) {
  const mainItems = items.filter((i) => !i.group || i.group === 'main');
  const financeItems = items.filter((i) => i.group === 'finance');
  const mgmtItems = items.filter((i) => i.group === 'management');

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950 border-e border-gray-200 dark:border-gray-800">
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800/80">
        <Link href={`/${locale}`} onClick={onNavigate} className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/25 transition-transform group-hover:scale-105">
            <Shield className="h-5 w-5 text-white" aria-hidden />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-none tracking-tight">EmpireShop</p>
            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-0.5 font-bold tracking-wide uppercase">پنل مدیریت</p>
          </div>
        </Link>
      </div>

      {/* ── User info ── */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/80">
        <div className="flex items-center gap-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-xs font-bold text-white shadow-sm ring-2 ring-indigo-200 dark:ring-indigo-800">
            {userName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{userName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden />
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">مدیر سیستم</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-2 panel-scrollbar"
        aria-label="ناوبری پنل مدیریت"
      >
        <NavGroup label="اصلی">
          {mainItems.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />
          ))}
        </NavGroup>
        {mgmtItems.length > 0 && (
          <NavGroup label="مدیریت">
            {mgmtItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />
            ))}
          </NavGroup>
        )}
        {financeItems.length > 0 && (
          <NavGroup label="مالی">
            {financeItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />
            ))}
          </NavGroup>
        )}
      </nav>

      {/* ── Bottom actions ── */}
      <div className="border-t border-gray-100 dark:border-gray-800/80 px-3 py-3 space-y-0.5">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            <Home className="h-3.5 w-3.5" aria-hidden />
          </div>
          بازگشت به سایت
        </Link>
        <Link
          href="/api/auth/logout"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30 flex-shrink-0">
            <LogOut className="h-3.5 w-3.5" aria-hidden />
          </div>
          خروج از حساب
        </Link>
      </div>
    </div>
  );
}

export function AdminShell({ locale, userName, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const base = `/${locale}/admin`;
  const items: NavItem[] = [
    { href: base, label: 'داشبورد', icon: LayoutDashboard, group: 'main' },
    { href: `${base}/products`, label: 'محصولات', icon: Package, group: 'main' },
    { href: `${base}/categories`, label: 'دسته‌بندی‌ها', icon: FolderTree, group: 'main' },
    { href: `${base}/orders`, label: 'سفارش‌ها', icon: ShoppingBag, group: 'main' },
    { href: `${base}/sellers`, label: 'فروشندگان', icon: Store, group: 'management' },

    { href: `${base}/users`, label: 'کاربران', icon: Users, group: 'management' },
    { href: `${base}/shipping-methods`, label: 'روش‌های ارسال', icon: Truck, group: 'management' },
    { href: `${base}/payments`, label: 'پرداخت‌ها', icon: CreditCard, group: 'finance' },
    { href: `${base}/payouts`, label: 'برداشت‌ها', icon: Wallet, group: 'finance' },
    { href: `${base}/reports`, label: 'گزارش درآمد', icon: BarChart3, group: 'finance' },
  ];

  function isActive(href: string) {
    if (href === base) return pathname === base || pathname === `${base}/`;
    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  const currentItem = items.find((i) => isActive(i.href));

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden w-[248px] shrink-0 md:flex md:flex-col shadow-sm">
        <SidebarContent items={items} isActive={isActive} userName={userName} locale={locale} />
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-[248px] shadow-2xl animate-slide-in-end">
            <SidebarContent
              items={items}
              isActive={isActive}
              userName={userName}
              locale={locale}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="بستن"
            className="absolute top-4 end-4 flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 px-4 shadow-sm backdrop-blur-md">
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors md:hidden"
            aria-label="باز کردن منو"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-indigo-500 shrink-0" aria-hidden />
              <span className="font-bold text-gray-900 dark:text-gray-100 hidden sm:block">پنل مدیریت</span>
            </div>
            {currentItem && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 hidden sm:block rtl:rotate-180 shrink-0" aria-hidden />
                <span className="text-gray-500 dark:text-gray-400 truncate text-sm">{currentItem.label}</span>
              </>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            <ThemeToggle variant="icon" lang={locale} />
            <button
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 transition-colors relative"
              aria-label="اعلان‌ها"
            >
              <Bell className="h-4 w-4" aria-hidden />
              {/* Notification dot */}
              <span className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-red-500 ring-1 ring-white dark:ring-gray-950" aria-hidden />
            </button>
            <Link
              href={`/${locale}/settings`}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              aria-label="تنظیمات"
            >
              <Settings className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main id="main" className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
