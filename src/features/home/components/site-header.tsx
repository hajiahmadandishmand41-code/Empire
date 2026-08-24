import { getLocale, getTranslations } from 'next-intl/server';
import { CartBadge } from '@/features/cart';
import { HeaderAuthActions } from '@/features/auth';
import { Heart, LayoutGrid, UsersRound, Sparkles, Compass } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { LanguageSwitcher } from './language-switcher';
import { HeaderCategoryNav } from './header-category-nav';
import { EshopLogo } from '@/components/eshop-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { HeaderSearchBar } from './header-search-bar';
import { AnnouncementBar } from './announcement-bar';

export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getTranslations('siteHeader');
  const brand = locale === 'en' ? 'Eshop' : 'ایشاپ';
  const clubLabel = locale === 'en' ? 'Eshop Club' : locale === 'ps' ? 'د ایشاپ کلب' : 'باشگاه ایشاپ';
  const traditionalLabel = locale === 'en' ? 'Local products' : locale === 'ps' ? 'کورني محصولات' : 'محصولات وطنی';
  const discoverLabel = locale === 'en' ? 'Discover' : locale === 'ps' ? 'کشف' : 'کشف';
  const wishlistLabel = locale === 'en' ? 'Wishlist' : locale === 'ps' ? 'خوښې' : 'علاقه‌مندی‌ها';

  return (
    <header className="sticky top-0 z-50 w-full" role="banner">
      <AnnouncementBar locale={locale} />
      <div className="site-header border-b border-border bg-card/98 backdrop-blur-md">
        <div className="mx-auto max-w-screen-xl px-2.5 sm:px-6">
          <div className="flex min-h-[3.5rem] items-center gap-1.5 sm:min-h-[4.5rem] sm:gap-4">
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Link href="/" className="group flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={t('logoAria')}>
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20 transition-transform duration-150 group-hover:scale-[1.02] sm:h-10 sm:w-10" aria-hidden="true"><EshopLogo size={28} variant="color" /></div>
                <div className="hidden flex-col ps-2 sm:flex"><span className="font-display text-[15px] font-extrabold leading-none tracking-tight text-foreground">{brand}</span><span className="mt-0.5 text-[9px] font-semibold leading-tight tracking-wide text-primary uppercase">{t('brandSubline')}</span></div>
              </Link>
              <Link href="/discover" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-[11px] font-extrabold text-primary transition hover:border-primary/35 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3.5 sm:text-xs"><Compass className="h-3.5 w-3.5" aria-hidden="true" />{discoverLabel}</Link>
            </div>
            <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
              <Link href="/categories" className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 py-2 text-xs font-bold text-secondary-foreground transition-colors hover:border-primary/30 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />{t('categories')}</Link>
              <Link href="/eshop" className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-bold text-primary transition-colors hover:border-primary/35 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><UsersRound className="h-3.5 w-3.5" aria-hidden="true" />{clubLabel}</Link>
              <Link href="/traditional" className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-bold text-primary transition-colors hover:border-primary/35 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />{traditionalLabel}</Link>
            </div>
            <div className="flex min-w-0 flex-1 items-center"><HeaderSearchBar locale={locale} /></div>
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
              <Link href="/wishlist" aria-label={wishlistLabel} title={wishlistLabel} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:w-10"><Heart className="h-4 w-4" /></Link>
              <LanguageSwitcher />
              <ThemeToggle variant="icon" lang={locale} />
              <div className="hidden md:flex"><HeaderAuthActions /></div>
              <div className="hidden md:flex"><CartBadge /></div>
            </div>
          </div>
        </div>
      </div>
      <HeaderCategoryNav />
    </header>
  );
}
