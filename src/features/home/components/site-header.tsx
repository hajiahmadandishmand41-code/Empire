import { getLocale, getTranslations } from 'next-intl/server';
import { CartBadge } from '@/features/cart';
import { HeaderAuthActions } from '@/features/auth';
import { Tag, Truck, LayoutGrid } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { LanguageSwitcher } from './language-switcher';
import { HeaderCategoryNav } from './header-category-nav';
import { EshopLogo } from '@/components/eshop-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { HeaderSearchBar } from './header-search-bar';

export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getTranslations('siteHeader');
  const topMessage = locale === 'en'
    ? 'Fast delivery across Afghanistan • Verified sellers • Today’s special offers'
    : locale === 'ps'
      ? 'په ټول افغانستان چټک لېږد • تایید شوي پلورونکي • د نن ځانګړي وړاندیزونه'
      : 'ارسال سریع در سراسر افغانستان • فروشندگان تأییدشده • پیشنهادهای ویژه امروز';

  return (
    <header className="sticky top-0 z-50 w-full" role="banner">
      <div className="overflow-hidden border-b border-orange-300/20 bg-gradient-to-r from-[#a94810] via-[#c56319] to-[#91350f] text-white">
        <div className="flex min-h-8 items-center overflow-hidden"><div className="whitespace-nowrap text-[10px] font-bold tracking-wide sm:text-[11px] animate-[marquee_18s_linear_infinite]"><span className="mx-8 inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-amber-200" aria-hidden="true" />{topMessage}</span><span className="mx-8 inline-flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-amber-200" aria-hidden="true" />{topMessage}</span></div></div>
        <style>{`@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
      </div>
      <div className="site-header border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-screen-xl px-3 sm:px-6"><div className="flex min-h-[3.75rem] items-center gap-2 sm:min-h-[4.5rem] sm:gap-4">
          <Link href="/" className="group flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={t('logoAria')}>
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20 transition-transform duration-150 group-hover:scale-[1.02] sm:h-10 sm:w-10" aria-hidden="true"><EshopLogo size={28} variant="color" /></div>
            <div className="hidden flex-col sm:flex"><span className="font-display text-[15px] font-extrabold leading-none tracking-tight text-foreground">Eshop</span><span className="mt-0.5 text-[9px] font-semibold leading-tight tracking-wide text-primary uppercase">{t('brandSubline')}</span></div>
          </Link>
          <Link href="/categories" className="hidden shrink-0 items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 py-2 text-xs font-bold text-secondary-foreground transition-colors hover:border-primary/30 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"><LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />{t('categories')}</Link>
          <div className="flex min-w-0 flex-1 items-center"><HeaderSearchBar locale={locale} /></div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5"><LanguageSwitcher /><ThemeToggle variant="icon" lang={locale} /><div className="hidden md:flex"><HeaderAuthActions /></div><CartBadge /></div>
        </div></div>
      </div>
      <HeaderCategoryNav />
    </header>
  );
}
