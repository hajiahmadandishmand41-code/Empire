import { getLocale, getTranslations } from 'next-intl/server';
import { CartBadge } from '@/features/cart';
import { HeaderAuthActions } from '@/features/auth';
import { Tag, Truck, LayoutGrid, PhoneCall } from 'lucide-react';
import { Link } from '@/i18n/routing';
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
      <div className="announcement-bar hidden sm:block">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
          <div className="flex min-h-8 items-center justify-between gap-3 py-1.5">
            <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-emerald-300"><Truck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{t('shippingBanner')}</span></div>
            <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-amber-300"><Tag className="h-3 w-3 shrink-0" aria-hidden="true" /><span className="truncate">{t('dailyDeals')}</span></div>
            <div className="hidden items-center gap-1.5 text-[11px] text-muted-foreground md:flex"><PhoneCall className="h-3 w-3 shrink-0" aria-hidden="true" /><a href="tel:+93798228441" dir="ltr" className="rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={t('hotlineAria')}>+93 798 228 441</a></div>
          </div>
        </div>
      </div>

      <div className="site-header border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
          <div className="flex min-h-[3.75rem] items-center gap-2 sm:min-h-[4.5rem] sm:gap-4">
            <Link href="/" className="group flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={t('logoAria')}>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20 transition-transform duration-150 group-hover:scale-[1.02] sm:h-10 sm:w-10" aria-hidden="true"><EmpireLogo size={28} variant="color" /></div>
              <div className="hidden flex-col sm:flex"><span className="font-display text-[15px] font-extrabold leading-none tracking-tight text-foreground">EmpireShop</span><span className="mt-0.5 text-[9px] font-semibold leading-tight tracking-wide text-primary uppercase">{t('brandSubline')}</span></div>
            </Link>

            <Link href="/categories" className="hidden shrink-0 items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 py-2 text-xs font-bold text-secondary-foreground transition-colors hover:border-primary/30 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex">
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />{t('categories')}
            </Link>

            <div className="flex min-w-0 flex-1 items-center"><HeaderSearchBar locale={locale} /></div>
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5"><LanguageSwitcher /><ThemeToggle variant="icon" lang={locale} /><div className="hidden md:flex"><HeaderAuthActions /></div><CartBadge /></div>
          </div>
        </div>
      </div>

      <HeaderCategoryNav />
    </header>
  );
}
