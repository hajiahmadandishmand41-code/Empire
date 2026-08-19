'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingBag, BarChart3, Wallet,
  Settings, Menu, LogOut, Bell, Home, Plus, X, ChevronRight, Briefcase,
  Users, TicketPercent, Star, Boxes, Store, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EshopLogo } from '@/components/eshop-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface SellerShellProps {
  locale: string;
  userName: string;
  storeName?: string;
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
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-100',
      )}
    >
      <div className={cn(
        'flex h-7 w-7 items-center justify-center rounded-lg transition-colors flex-shrink-0',
        active
          ? 'bg-emerald-100 dark:bg-emerald-900/50'
          : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700',
      )}>
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400',
          )}
          aria-hidden="true"
        />
      </div>
      <span className="flex-1 leading-tight">{item.label}</span>
      {item.badge !== undefined && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white shadow-sm">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SidebarContent({
  items,
  isActive,
  userName,
  storeName,
  locale,
  onNavigate,
}: {
  items: NavItem[];
  isActive: (href: string) => boolean;
  userName: string;
  storeName?: string;
  locale: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950 border-e border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800/80">
        <Link href={`/${locale}`} onClick={onNavigate} className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25 transition-transform group-hover:scale-105">
            <EshopLogo size={26} variant="color" />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-none tracking-tight">Eshop</p>
            <p className="text-[10px] text-emerald-500 dark:text-emerald-400 mt-0.5 font-bold tracking-wide uppercase">Seller Center</p>
          </div>
        </Link>
      </div>

      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/80">
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-white shadow-sm ring-2 ring-emerald-200 dark:ring-emerald-800">
            {userName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{userName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden />
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">{storeName ?? 'فروشنده'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-800/80">
        <Link
          href={`/${locale}/seller/products/new`}
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-2.5 text-xs font-bold text-white hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          ثبت محصول جدید
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 panel-scrollbar" aria-label="ناوبری پنل فروشنده">
        {items.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />)}
      </nav>

      <div className="border-t border-gray-100 dark:border-gray-800/80 px-3 py-3 space-y-0.5">
        <Link href={`/${locale}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0"><Home className="h-3.5 w-3.5" aria-hidden /></div>
          بازگشت به سایت
        </Link>
        <Link href="/api/auth/logout" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30 flex-shrink-0"><LogOut className="h-3.5 w-3.5" aria-hidden /></div>
          خروج از حساب
        </Link>
      </div>
    </div>
  );
}

export function SellerShell({ locale, userName, storeName, children }: SellerShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const base = `/${locale}/seller`;
  const items: NavItem[] = [
    { href: base, label: 'داشبورد', icon: LayoutDashboard },
    { href: `${base}/products`, label: 'محصولات من', icon: Package },
    { href: `${base}/products/new`, label: 'افزودن محصول', icon: Plus },
    { href: `${base}/inventory`, label: 'موجودی', icon: Boxes },
    { href: `${base}/orders`, label: 'سفارش‌ها', icon: ShoppingBag },
    { href: `${base}/customers`, label: 'مشتریان', icon: Users },
    { href: `${base}/discounts`, label: 'تخفیف‌ها', icon: TicketPercent },
    { href: `${base}/reviews`, label: 'نظرات', icon: Star },
    { href: `${base}/wallet`, label: 'درآمد و کیف پول', icon: Wallet },
    { href: `${base}/reports`, label: 'Analytics', icon: BarChart3 },
    { href: `${base}/storefront`, label: 'فروشگاه من', icon: Store },
    { href: `${base}/settings`, label: 'تنظیمات فروشگاه', icon: Settings },
  ];

  function isActive(href: string) {
    if (href === base) return pathname === base || pathname === `${base}/`;
    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  const currentItem = items.find((i) => isActive(i.href));
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="hidden w-[248px] shrink-0 md:flex md:flex-col shadow-sm">
        <SidebarContent items={items} isActive={isActive} userName={userName} storeName={storeName} locale={locale} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-[248px] shadow-2xl animate-slide-in-end">
            <SidebarContent items={items} isActive={isActive} userName={userName} storeName={storeName} locale={locale} onNavigate={() => setMobileOpen(false)} />
          </aside>
          <button onClick={() => setMobileOpen(false)} aria-label="بستن" className="absolute top-4 end-4 flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 transition-colors"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 px-4 shadow-sm backdrop-blur-md">
          <button className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors md:hidden" aria-label="باز کردن منو" onClick={() => setMobileOpen(true)}><Menu className="h-4 w-4" /></button>
          <div className="flex items-center gap-2 text-sm min-w-0">
            <div className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden /><span className="font-bold text-gray-900 dark:text-gray-100 hidden sm:block">Seller Center</span></div>
            {currentItem && <><ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 hidden sm:block rtl:rotate-180 shrink-0" aria-hidden /><span className="text-gray-500 dark:text-gray-400 truncate text-sm">{currentItem.label}</span></>}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <Link href={`${base}/products/new`} className="hidden sm:flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm hover:shadow-emerald-500/25"><Plus className="h-3.5 w-3.5" />محصول جدید</Link>
            <Link href={`${base}/products`} aria-label="جستجوی محصولات" className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"><Search className="h-4 w-4" /></Link>
            <ThemeToggle variant="icon" lang={locale} />
            <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-emerald-600 transition-colors" aria-label="اعلان‌ها"><Bell className="h-4 w-4" /></button>
          </div>
        </header>
        <main id="main" className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
