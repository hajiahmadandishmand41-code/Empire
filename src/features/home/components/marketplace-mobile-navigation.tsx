'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Home, LayoutGrid, Search, ShoppingCart, User, X, ClipboardList, Heart, MapPin, Settings, Phone, Info, LogOut, ShieldCheck, Briefcase } from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useHydratedCartCount } from '@/features/cart';

type MeUser = { id: string; fullName: string; email?: string; role: 'customer' | 'seller' | 'admin' };
type MenuItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

export function MarketplaceMobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const cartCount = useHydratedCartCount();
  const t = useTranslations('nav');
  const h = useTranslations('siteHeader');
  const c = useTranslations('common');
  const a = useTranslations('accountNav');
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((response) => response.json())
      .then((data: { ok?: boolean; data?: { user?: MeUser } }) => {
        if (cancelled) return;
        if (data.ok && data.data?.user) setUser(data.data.user);
        setUserLoaded(true);
      })
      .catch(() => { if (!cancelled) setUserLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    document.body.style.overflow = accountOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [accountOpen]);

  async function onLogout() {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); }
    finally {
      setUser(null);
      setAccountOpen(false);
      router.push('/');
      router.refresh();
    }
  }

  const isHome = pathname === '/';
  const isCategories = pathname.includes('/categories') || pathname.includes('/category/');
  const isSearch = pathname.includes('/search');
  const isCart = pathname.includes('/cart') || pathname.includes('/checkout');
  const isAccount = pathname.includes('/profile') || pathname.includes('/orders') || pathname.includes('/settings') || pathname.includes('/seller') || pathname.includes('/admin');

  const accountMenuItems: MenuItem[] = user ? [
    { href: '/profile', label: h('profile'), icon: User },
    { href: '/orders', label: h('myOrders'), icon: ClipboardList },
    { href: '/wishlist', label: t('wishlist'), icon: Heart },
    { href: '/profile/addresses', label: a('addresses'), icon: MapPin },
    { href: '/settings', label: a('settings'), icon: Settings },
    ...(user.role === 'seller' ? [{ href: '/seller', label: h('sellerPanel'), icon: Briefcase }] : []),
    ...(user.role === 'admin' ? [{ href: '/admin', label: h('adminPanel'), icon: ShieldCheck }] : []),
    { href: '/contact', label: t('contact'), icon: Phone },
    { href: '/about', label: t('about'), icon: Info },
  ] : [];

  function NavItem({ href, active, label, children }: { href: string; active: boolean; label: string; children: React.ReactNode }) {
    return <Link href={href as never} aria-label={label} className={cn('relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors duration-150', active ? 'text-primary' : 'text-muted-foreground')}>
      {active && <span className="absolute inset-x-4 top-0 h-[2px] rounded-b-full bg-primary" aria-hidden />}
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition-colors', active ? 'bg-accent' : '')}>{children}</span>
      <span className="max-w-[72px] truncate">{label}</span>
    </Link>;
  }

  const accountLabel = locale === 'en' ? 'Account' : locale === 'ps' ? 'حساب' : 'حساب';
  const searchLabel = locale === 'en' ? 'Search' : locale === 'ps' ? 'لټون' : 'جستجو';
  const categoriesLabel = locale === 'en' ? 'Categories' : locale === 'ps' ? 'وېشنیزې' : 'دسته‌ها';

  return <>
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-[0_-6px_24px_hsl(var(--foreground)/.06)] backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
      <div className="mx-auto grid max-w-md grid-cols-5 items-stretch px-1">
        <NavItem href="/" active={isHome} label={t('home')}><Home className="h-5 w-5" /></NavItem>
        <NavItem href="/categories" active={isCategories} label={categoriesLabel}><LayoutGrid className="h-5 w-5" /></NavItem>
        <NavItem href="/search" active={isSearch} label={searchLabel}><Search className="h-5 w-5" /></NavItem>
        <NavItem href="/cart" active={isCart} label={t('cart')}>
          <span className="relative flex h-6 w-6 items-center justify-center">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && <span aria-hidden="true" className="absolute -end-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">{cartCount > 9 ? '۹+' : cartCount}</span>}
          </span>
        </NavItem>
        <button type="button" onClick={() => user ? setAccountOpen(true) : userLoaded && router.push('/auth/login')} className={cn('relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold', isAccount ? 'text-primary' : 'text-muted-foreground')} aria-label={user ? accountLabel : h('login')}>
          {isAccount && <span className="absolute inset-x-4 top-0 h-[2px] rounded-b-full bg-primary" aria-hidden />}
          <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', isAccount ? 'bg-accent' : '')}>{user ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{user.fullName.charAt(0)}</span> : <User className="h-5 w-5" />}</span>
          <span className="max-w-[72px] truncate">{user ? accountLabel : userLoaded ? h('login') : c('loading')}</span>
        </button>
      </div>
      <div className="pb-safe" />
    </nav>

    {accountOpen && user && <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={accountLabel}>
      <button type="button" className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm" aria-label={c('close')} onClick={() => setAccountOpen(false)} />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card shadow-2xl">
        <div className="flex justify-center pb-1 pt-3"><div className="h-1 w-10 rounded-full bg-muted" /></div>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground">{user.fullName.charAt(0)}</div><div><p className="text-sm font-bold">{user.fullName}</p>{user.email && <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>}<p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">{accountLabel}</p></div></div>
          <button type="button" onClick={() => setAccountOpen(false)} aria-label={c('close')} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <nav className="space-y-0.5 px-3 py-3">{accountMenuItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href as never} onClick={() => setAccountOpen(false)} className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold hover:bg-muted"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><Icon className="h-4 w-4 text-muted-foreground" /></span>{label}</Link>)}<button type="button" onClick={onLogout} className="mt-2 flex w-full items-center gap-3 border-t border-border px-3.5 pt-3 py-3 text-sm font-semibold text-destructive"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10"><LogOut className="h-4 w-4" /></span>{h('logout')}</button></nav>
        <div className="pb-safe" />
      </div>
    </div>}
  </>;
}
