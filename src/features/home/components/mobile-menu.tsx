'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  X, Home, Store, Package, Search, ShoppingCart,
  Tag, Smartphone, Monitor, Headphones, Watch, Camera, Shirt,
  BookOpen, Dumbbell, Gem, Baby, Utensils, ShoppingBag, HomeIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { EmpireLogo } from '@/components/empire-logo';
import { useHydratedCartCount } from '@/features/cart/hooks/use-hydrated-cart';

interface Item {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  badge?: number | string;
}

export function MobileMenu({ locale = 'fa', onClose }: { locale?: string; onClose?: () => void }) {
  const t = useTranslations('mobileMenu');
  const tCat = useTranslations('categoryNav');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cartCount = useHydratedCartCount();
  const brand = locale === 'en' ? 'Eshop' : 'ایشاپ';

  function close() {
    onClose?.();
  }

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    close();
  }, [pathname, searchParams]);

  const primary: Item[] = [
    { href: '/',                    label: t('home'),        icon: Home },
    { href: '/categories',          label: t('categories'),  icon: Package },
    { href: '/shop',                label: t('shop'),        icon: Store },
    { href: '/shop?badge=sale',     label: 'پیشنهادات ویژه', icon: Tag },
    { href: '/search',              label: t('search'),      icon: Search },
    {
      href: '/cart',
      label: t('cart'),
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : undefined,
    },
  ];

  const categories: Item[] = [
    { href: '/categories',           label: tCat('all'),         icon: ShoppingBag },
    { href: '/category/digital',     label: tCat('mobile'),      icon: Smartphone },
    { href: '/category/digital',     label: tCat('computer'),    icon: Monitor },
    { href: '/category/electronics', label: tCat('audio'),       icon: Headphones },
    { href: '/category/watches',     label: tCat('wearable'),    icon: Watch },
    { href: '/category/electronics', label: tCat('camera'),      icon: Camera },
    { href: '/category/homeAppliances', label: tCat('home'),     icon: HomeIcon },
    { href: '/category/clothing',    label: tCat('fashion'),     icon: Shirt },
    { href: '/category/sports',      label: tCat('sport'),       icon: Dumbbell },
    { href: '/category/beauty',      label: tCat('beauty'),      icon: Utensils },
    { href: '/traditional',          label: tCat('traditional'), icon: Gem },
    { href: '/category/books',       label: tCat('books'),       icon: BookOpen },
    { href: '/category/baby',        label: tCat('baby'),        icon: Baby },
    { href: '/category/electronics', label: tCat('accessories'), icon: Package },
  ];

  const itemCls = cn(
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
    'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-rose-600 dark:hover:text-rose-400',
  );

  function renderItem(item: Item) {
    const Icon = item.icon;
    const inner = (
      <>
        <Icon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
        <span className="flex-1">{item.label}</span>
        {item.badge !== undefined && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {item.badge}
          </span>
        )}
      </>
    );

    if (item.href) {
      return (
        <Link
          key={item.label + item.href}
          href={item.href as Parameters<typeof Link>[0]['href']}
          onClick={close}
          className={itemCls}
        >
          {inner}
        </Link>
      );
    }
    return null;
  }

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label={t('menu')}
    >
      <aside className="relative flex w-[18rem] max-w-[85vw] flex-col bg-white dark:bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3">
          <Link href="/" onClick={close} className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 shadow-sm transition-all group-hover:bg-rose-700">
              <EmpireLogo size={22} variant="color" />
            </div>
            <span className="font-display text-[14px] font-extrabold text-gray-900 dark:text-white">
              {brand}
            </span>
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label={t('close')}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <nav dir="rtl" className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          <div className="space-y-0.5">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-600">
              ناوبری
            </p>
            {primary.map(renderItem)}
          </div>

          <div className="space-y-0.5 pt-1 border-t border-gray-100 dark:border-gray-800">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-600">
              {t('categories')}
            </p>
            {categories.map(renderItem)}
          </div>
        </nav>

        <div dir="rtl" className="border-t border-gray-100 dark:border-gray-800 p-3 flex items-center justify-between gap-2">
          <LanguageSwitcher />
          <ThemeToggle variant="dropdown" lang={locale} />
        </div>
      </aside>

      <div
        className="flex-1 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={close}
      />
    </div>
  );
}
