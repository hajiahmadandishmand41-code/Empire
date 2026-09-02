'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  FolderTree,
  Tags,
  ShoppingBag,
  Users,
  Store,
  BarChart3,
  WalletCards,
  Settings,
  Bell,
  Menu,
  X,
  Plus,
  LogOut,
  ExternalLink,
  ChevronLeft,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface Props {
  locale: string;
  userName: string;
  storeName?: string | null;
  children: React.ReactNode;
}

type Item = { slug: string; label: string; icon: React.ElementType };

type Group = { title: string; items: Item[] };

const groups: Group[] = [
  {
    title: 'مرکز فروش',
    items: [
      { slug: '', label: 'داشبورد', icon: LayoutDashboard },
      { slug: 'products', label: 'محصولات', icon: Package },
      { slug: 'inventory', label: 'موجودی انبار', icon: Boxes },
      { slug: 'categories', label: 'دسته‌بندی‌ها', icon: FolderTree },
      { slug: 'brands', label: 'برندها', icon: Tags },
    ],
  },
  {
    title: 'فروشگاه',
    items: [
      { slug: 'orders', label: 'سفارش‌ها', icon: ShoppingBag },
      { slug: 'customers', label: 'مشتریان', icon: Users },
      { slug: 'store', label: 'فروشگاه من', icon: Store },
    ],
  },
  {
    title: 'مالی و تحلیل',
    items: [
      { slug: 'analytics', label: 'تحلیل فروش', icon: BarChart3 },
      { slug: 'wallet', label: 'کیف پول و تسویه', icon: WalletCards },
    ],
  },
  {
    title: 'حساب',
    items: [
      { slug: 'notifications', label: 'اعلان‌ها', icon: Bell },
      { slug: 'settings', label: 'تنظیمات', icon: Settings },
    ],
  },
];

function SidebarNav({ locale, onClose }: { locale: string; onClose?: () => void }) {
  const pathname = usePathname();
  const base = `/${locale}/seller`;
  return (
    <nav className="space-y-5 px-3 py-4" dir="rtl">
      {groups.map((group) => (
        <section key={group.title}>
          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {group.title}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const href = item.slug ? `${base}/${item.slug}` : base;
              const active = item.slug
                ? pathname === href || pathname.startsWith(`${href}/`)
                : pathname === base || pathname === `${base}/`;
              const Icon = item.icon;
              return (
                <Link
                  key={item.slug || 'dashboard'}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
                    active
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {active ? <ChevronLeft className="h-3.5 w-3.5 opacity-70" /> : null}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

export function SellerShell({ locale, userName, storeName, children }: Props) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const router = useRouter();
  const shop = storeName || 'فروشگاه من';

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace(`/${locale}/auth/login`);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950" dir="rtl">
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-[280px] border-l border-slate-200 bg-white md:block">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <div className="text-lg font-black tracking-tight">Empire</div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Seller Center</div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700">LIVE</span>
        </div>

        <div className="border-b border-slate-200 p-4">
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-l from-emerald-50 to-white p-3">
            <div className="text-sm font-black truncate">{shop}</div>
            <div className="mt-1 text-xs text-slate-500 truncate">{userName}</div>
          </div>
        </div>

        <div className="px-4 pt-3">
          <Link
            href={`/${locale}/seller/products/new`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-3 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            محصول جدید
          </Link>
        </div>

        <div className="h-[calc(100vh-252px)] overflow-y-auto">
          <SidebarNav locale={locale} />
        </div>

        <div className="border-t border-slate-200 p-3">
          <Link href={`/${locale}`} className="mb-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
            <ExternalLink className="h-4 w-4" />
            مشاهده سایت
          </Link>
          <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
      </aside>

      <div className="md:mr-[280px]">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-xl border border-slate-200 p-2 md:hidden" aria-label="منو">
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black">{shop}</div>
            <div className="truncate text-[11px] text-slate-500">مدیریت محصولات، سفارش‌ها، فروشگاه و درآمد</div>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 lg:flex">
            <Search className="h-4 w-4" />
            <span>جست‌وجو در پنل</span>
          </div>
          <Link href={`/${locale}/seller/notifications`} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <Bell className="h-4 w-4" />
          </Link>
          <ThemeToggle variant="icon" lang={locale} />
        </header>

        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-7">{children}</main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-slate-950/45" onClick={() => setMobileOpen(false)} aria-label="بستن منو" />
          <aside className="absolute inset-y-0 right-0 w-[300px] max-w-[86vw] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <div className="font-black">Empire Seller Center</div>
              <button onClick={() => setMobileOpen(false)} className="rounded-xl border border-slate-200 p-2"><X className="h-5 w-5" /></button>
            </div>
            <div className="border-b border-slate-200 p-4">
              <div className="font-black">{shop}</div>
              <div className="mt-1 text-xs text-slate-500">{userName}</div>
            </div>
            <SidebarNav locale={locale} onClose={() => setMobileOpen(false)} />
            <div className="border-t border-slate-200 p-3">
              <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" />
                خروج
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
