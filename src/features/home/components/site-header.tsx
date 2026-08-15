import { getLocale, getTranslations } from 'next-intl/server';
import { CartBadge } from '@/features/cart';
import { HeaderAuthActions } from '@/features/auth';
import { Tag, Truck, LayoutGrid, PhoneCall } from 'lucide-react';
import Link from 'next/link';
import { LanguageSwitcher } from './language-switcher';
import { HeaderCategoryNav } from './header-category-nav';
import { EmpireLogo } from '@/components/empire-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { HeaderSearchBar } from './header-search-bar';

export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getTranslations('siteHeader');

  return (
    <header className="sticky top-0 z-50 w-full" role="banner">
      {/* ── Announcement bar ── */}
      <div className="announcement-bar">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-2">
            {/* Left: shipping banner */}
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
              <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden xs:inline">{t('shippingBanner')}</span>
            </div>

            {/* Center: deals */}
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300">
              <Tag className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{t('dailyDeals')}</span>
            </div>

            {/* Right: hotline */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <PhoneCall className="h-3 w-3 shrink-0" aria-hidden="true" />
              <a
                href="tel:+93798228441"
                dir="ltr"
                className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                aria-label="تماس با ما: ۹۸ ۲۲۸ ۴۴۱ ۷۹۸ ۹۳+"
              >
                +93 798 228 441
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main header ── */}
      <div className="bg-card border-b border-border site-header">
        <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
          <div className="flex h-[4.5rem] items-center gap-3 sm:gap-4">

            {/* Logo */}
            <Link
              href={`/${locale}`}
              className="flex shrink-0 items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-lg"
              aria-label="Empire Shop — صفحه اصلی"
            >
              <div
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-md shadow-rose-500/30 transition-all group-hover:shadow-rose-500/50 group-hover:scale-105"
                aria-hidden="true"
              >
                <EmpireLogo size={28} variant="color" />
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="font-display text-[15px] font-extrabold leading-none tracking-tight text-foreground">
                  EmpireShop
                </span>
                <span className="text-[9px] leading-tight text-primary mt-0.5 font-semibold tracking-wide uppercase">
                  {t('brandSubline')}
                </span>
              </div>
            </Link>

            {/* Category browse button (desktop) */}
            <Link
              href={`/${locale}/shop`}
              className="hidden lg:flex shrink-0 items-center gap-2 rounded-xl bg-secondary border border-border px-3.5 py-2 text-xs font-bold text-secondary-foreground transition-all hover:bg-accent hover:text-accent-foreground hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              {t('categories')}
            </Link>

            {/* Search bar — full width flex */}
            <div className="flex flex-1 items-center min-w-0">
              <HeaderSearchBar locale={locale} />
            </div>

            {/* Right actions */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              {/* Language switcher */}
              <LanguageSwitcher />

              {/* Theme toggle */}
              <ThemeToggle variant="icon" lang={locale} />

              {/* Auth actions — md+ */}
              <div className="hidden md:flex">
                <HeaderAuthActions />
              </div>

              {/* Cart */}
              <CartBadge />
            </div>
          </div>
        </div>
      </div>

      {/* ── Category navigation row ── */}
      <HeaderCategoryNav />
    </header>
  );
}
