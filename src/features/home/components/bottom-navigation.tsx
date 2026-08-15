'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  Home, LayoutGrid, ShoppingCart, User,
  X, LogIn, UserPlus, Store, ClipboardList, Heart,
  MapPin, Settings, Phone, Info, LogOut, ShieldCheck, Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHydratedCartCount } from '@/features/cart/hooks/use-hydrated-cart';
import { useWishlistStore, selectWishlistCount } from '@/features/wishlist';
import Link from 'next/link';

type MeUser = {
  id: string;
  fullName: string;
  email?: string;
  role: 'customer' | 'seller' | 'admin';
};

interface AccountMenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  admin:    { bg: 'bg-indigo-100 dark:bg-indigo-900/40',   text: 'text-indigo-700 dark:text-indigo-400',   label: 'مدیر سیستم' },
  seller:   { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400', label: 'فروشنده' },
  customer: { bg: 'bg-rose-100 dark:bg-rose-900/40',       text: 'text-rose-700 dark:text-rose-400',       label: 'مشتری' },
};

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const cartCount = useHydratedCartCount();
  const wishlistCount = useWishlistStore(selectWishlistCount);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d: { ok?: boolean; data?: { user?: MeUser } }) => {
        if (!cancelled) {
          if (d?.ok && d?.data?.user) setUser(d.data.user);
          setUserLoaded(true);
        }
      })
      .catch(() => { if (!cancelled) setUserLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    document.body.style.overflow = accountOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [accountOpen]);

  async function onLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    setUser(null);
    setAccountOpen(false);
    router.push('/');
    router.refresh();
  }

  const isHome     = pathname === '/';
  const isShop     = pathname.includes('/shop') || pathname.includes('/search');
  const isCart     = pathname === '/cart';
  const isWishlist = pathname === '/wishlist';
  const isAccount  = pathname.includes('/profile') || pathname.includes('/orders');

  const accountMenuItems: AccountMenuItem[] = user
    ? [
        { href: '/profile',           label: 'پروفایل من',     icon: User },
        { href: '/orders',            label: 'سفارش‌های من',    icon: ClipboardList },
        { href: '/wishlist',          label: 'علاقه‌مندی‌ها',   icon: Heart },
        { href: '/profile/addresses', label: 'آدرس‌های من',     icon: MapPin },
        { href: '/settings',          label: 'تنظیمات',         icon: Settings },
        ...(user.role === 'seller'   ? [{ href: '/seller',       label: 'پنل فروشنده',   icon: Briefcase }]    : []),
        ...(user.role === 'admin'    ? [{ href: '/admin',        label: 'پنل مدیریت',    icon: ShieldCheck }]  : []),
        { href: '/contact', label: 'تماس با ما', icon: Phone },
        { href: '/about',   label: 'درباره ما',  icon: Info },
      ]
    : [];

  function NavItem({
    href,
    active,
    label,
    badge,
    children,
  }: {
    href: string;
    active: boolean;
    label: string;
    badge?: number;
    children: React.ReactNode;
  }) {
    return (
      <Link
        href={href as Parameters<typeof Link>[0]['href']}
        aria-label={label}
        className={cn(
          'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors duration-150',
          active ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-gray-400',
        )}
      >
        {active && (
          <span className="absolute top-0 inset-x-3 h-[3px] rounded-b-full bg-gradient-to-r from-rose-500 to-rose-600 dark:from-rose-400 dark:to-rose-500" aria-hidden />
        )}
        {badge !== undefined && badge > 0 && (
          <span className="absolute end-[10%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white shadow-sm">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        {children}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-gray-200/80 dark:border-gray-800/80 bg-white/97 dark:bg-gray-950/97 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
        aria-label="ناوبری پایین صفحه"
      >
        <div className="flex items-stretch">
          <NavItem href="/" active={isHome} label="خانه">
            <Home className={cn('h-5 w-5 transition-all', isHome && 'fill-rose-100 dark:fill-rose-900/50 scale-110')} aria-hidden />
          </NavItem>

          <NavItem href="/shop?view=categories" active={isShop && !isCart} label="دسته‌ها">
            <LayoutGrid className={cn('h-5 w-5 transition-all', isShop && !isCart && 'scale-110')} aria-hidden />
          </NavItem>

          <NavItem href="/wishlist" active={isWishlist} badge={wishlistCount} label="علاقه‌مندی‌ها">
            <Heart className={cn('h-5 w-5 transition-all', isWishlist && 'fill-rose-500 text-rose-500 scale-110')} aria-hidden />
          </NavItem>

          <NavItem href="/cart" active={isCart} badge={cartCount} label="سبد">
            <ShoppingCart className={cn('h-5 w-5 transition-all', isCart && 'scale-110')} aria-hidden />
          </NavItem>

          {/* Account button — goes to login if guest, opens sheet if logged in */}
          <button
            type="button"
            onClick={() => {
              if (!user && userLoaded) {
                // Guest: navigate directly to login page
                router.push('/auth/login');
              } else if (user) {
                setAccountOpen(true);
              }
            }}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors duration-150',
              isAccount ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-gray-400',
            )}
            aria-label={user ? 'حساب کاربری' : 'ورود به حساب'}
          >
            {user ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-[10px] font-bold text-white shadow-sm ring-1 ring-rose-200 dark:ring-rose-800">
                {user.fullName.charAt(0)}
              </div>
            ) : (
              <User className="h-5 w-5" aria-hidden />
            )}
            {!userLoaded ? (
              <span className="h-2 w-8 rounded skeleton" />
            ) : (
              <span className={user ? 'text-[9px] leading-none max-w-[60px] truncate' : 'text-[10px]'}>
                {user ? user.fullName.split(' ')[0] : 'ورود'}
              </span>
            )}
            {isAccount && (
              <span className="absolute top-0 inset-x-3 h-[3px] rounded-b-full bg-gradient-to-r from-rose-500 to-rose-600 dark:from-rose-400 dark:to-rose-500" aria-hidden />
            )}
          </button>
        </div>

        {/* Safe area spacer */}
        <div className="h-safe-area-inset-bottom" />
      </nav>

      {/* ── Account sheet (only shown when logged in) ── */}
      {accountOpen && user && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="حساب کاربری">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setAccountOpen(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 inset-x-0 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 text-base font-bold text-white shadow-md">
                  {user.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{user.fullName}</p>
                  {user.email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
                  )}
                  <span className={cn(
                    'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold mt-0.5',
                    ROLE_COLORS[user.role]?.bg,
                    ROLE_COLORS[user.role]?.text,
                  )}>
                    {ROLE_COLORS[user.role]?.label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAccountOpen(false)}
                aria-label="بستن"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Menu */}
            <nav className="px-3 py-3 space-y-0.5">
              {accountMenuItems.map(({ href, label, icon: Icon, accent }) => (
                <Link
                  key={href}
                  href={href as Parameters<typeof Link>[0]['href']}
                  onClick={() => setAccountOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors',
                    accent
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/70',
                  )}
                >
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0',
                    accent ? 'bg-rose-100 dark:bg-rose-900/50' : 'bg-gray-100 dark:bg-gray-800',
                  )}>
                    <Icon className={cn('h-4 w-4', accent ? 'text-rose-600' : 'text-gray-500 dark:text-gray-400')} aria-hidden />
                  </div>
                  {label}
                </Link>
              ))}

              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors mt-2 border-t border-gray-100 dark:border-gray-800/80 pt-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40 flex-shrink-0">
                  <LogOut className="h-4 w-4" aria-hidden />
                </div>
                خروج از حساب
              </button>
            </nav>

            <div className="h-safe-area-inset-bottom" />
          </div>
        </div>
      )}
    </>
  );
}
