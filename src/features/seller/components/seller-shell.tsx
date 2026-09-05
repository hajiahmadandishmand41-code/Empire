'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, BarChart3, Wallet, Settings, Menu, LogOut, Bell, Home, Plus, X, ChevronRight, Briefcase, Users, TicketPercent, Star, Boxes, Store, Search, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EshopLogo } from '@/components/eshop-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavItem { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number; }
interface SellerShellProps { locale: string; userName: string; storeName?: string; children: React.ReactNode; }

/* ─── Sidebar nav link ─────────────────────────────────────────────── */
function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-primary/10 text-primary shadow-sm dark:bg-primary/15'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
          active
            ? 'bg-primary/15 text-primary dark:bg-primary/20'
            : 'bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground',
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <span className="flex-1 leading-tight">{item.label}</span>
      {item.badge !== undefined && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/* ─── Logout button ────────────────────────────────────────────────── */
function LogoutButton({ locale, onNavigate }: { locale: string; onNavigate?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('logout_failed');
      onNavigate?.();
      router.replace(`/${locale}/login`);
      router.refresh();
    } catch { setBusy(false); }
  }
  return (
    <button type="button" disabled={busy} onClick={() => void handleLogout()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60 disabled:cursor-wait">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10"><LogOut className="h-3.5 w-3.5" /></div>
      {busy ? 'در حال خروج…' : 'خروج از حساب'}
    </button>
  );
}

/* ─── Sidebar content (shared between desktop + mobile drawer) ─────── */
function SidebarContent({ items, isActive, userName, storeName, locale, onNavigate }: { items: NavItem[]; isActive: (href: string) => boolean; userName: string; storeName?: string; locale: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col border-e border-border bg-card">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-4">
        <Link href={`/${locale}`} onClick={onNavigate} className="group flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-brand shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
            <EshopLogo size={26} variant="color" />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-extrabold leading-none tracking-tight text-foreground">Eshop</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">Seller Center</p>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-brand text-xs font-bold text-primary-foreground shadow-sm ring-2 ring-primary/20">
            {userName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-foreground">{userName}</p>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              <p className="truncate text-[10px] font-semibold text-primary">{storeName ?? 'فروشنده'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick action */}
      <div className="border-b border-border/60 px-3 py-3">
        <Link href={`/${locale}/seller/products/new`} onClick={onNavigate} className="btn-empire flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs">
          <Plus className="h-3.5 w-3.5" />ثبت محصول جدید
        </Link>
      </div>

      {/* Nav */}
      <nav className="panel-scrollbar flex-1 space-y-0.5 overflow-y-auto px-3 py-3" aria-label="ناوبری پنل فروشنده">
        {items.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />)}
      </nav>

      {/* Footer */}
      <div className="space-y-0.5 border-t border-border/60 px-3 py-3">
        <Link href={`/${locale}`} onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60"><Home className="h-3.5 w-3.5" /></div>
          بازگشت به سایت
        </Link>
        <LogoutButton locale={locale} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

/* ─── Main shell ───────────────────────────────────────────────────── */
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
    { href: `${base}/brands`, label: 'برندها', icon: Tags },
    { href: `${base}/discounts`, label: 'تخفیف‌ها', icon: TicketPercent },
    { href: `${base}/reviews`, label: 'نظرات', icon: Star },
    { href: `${base}/notifications`, label: 'اعلان‌ها', icon: Bell },
    { href: `${base}/wallet`, label: 'درآمد و کیف پول', icon: Wallet },
    { href: `${base}/reports`, label: 'گزارش‌ها', icon: BarChart3 },
    { href: `${base}/storefront`, label: 'فروشگاه من', icon: Store },
    { href: `${base}/settings`, label: 'تنظیمات فروشگاه', icon: Settings },
  ];

  const isActive = (href: string) =>
    href === base
      ? pathname === base || pathname === `${base}/`
      : pathname === href || pathname?.startsWith(`${href}/`);

  const currentItem = items.find((i) => isActive(i.href));

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-[248px] shrink-0 md:flex md:flex-col shadow-sm">
        <SidebarContent items={items} isActive={isActive} userName={userName} storeName={storeName} locale={locale} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-[248px] shadow-2xl">
            <SidebarContent items={items} isActive={isActive} userName={userName} storeName={storeName} locale={locale} onNavigate={() => setMobileOpen(false)} />
          </aside>
          <button onClick={() => setMobileOpen(false)} aria-label="بستن" className="absolute end-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm hover:bg-white/25">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 shadow-sm backdrop-blur-md">
          <button className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted md:hidden" aria-label="باز کردن منو" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="hidden font-bold text-foreground sm:block">Seller Center</span>
            </div>
            {currentItem && (
              <>
                <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/50 sm:block rtl:rotate-180" aria-hidden />
                <span className="truncate text-sm text-muted-foreground">{currentItem.label}</span>
              </>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            <Link href={`${base}/products/new`} className="btn-empire hidden items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs sm:flex">
              <Plus className="h-3.5 w-3.5" />محصول جدید
            </Link>
            <Link href={`${base}/products`} aria-label="جستجوی محصولات" className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted">
              <Search className="h-4 w-4" />
            </Link>
            <ThemeToggle variant="icon" lang={locale} />
            <Link href={`${base}/notifications`} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted" aria-label="اعلان‌ها">
              <Bell className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main id="main" className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
