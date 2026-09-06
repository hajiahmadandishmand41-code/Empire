import { getLocale, getTranslations } from 'next-intl/server';
import { HeaderAuthActions } from '@/features/auth';
import { Heart, Compass, Sparkles, Tags, Store } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { LanguageSwitcher } from './language-switcher';
import { HeaderCategoryNav } from './header-category-nav';
import { EshopLogo } from '@/components/eshop-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { HeaderSearchBar } from './header-search-bar';
import { AnnouncementBar } from './announcement-bar';

// One class per nav variant. These were previously five copies of a long
// utility string that had quietly drifted apart (different paddings, font
// weights and hover colours), which is why the header row looked ragged.
const navLinkBase =
  'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const navLinkPrimary = `${navLinkBase} bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90`;
const navLinkQuiet = `${navLinkBase} border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary`;
const navLinkAccent = `${navLinkBase} border border-primary/25 bg-primary/5 font-black text-primary hover:border-primary/45 hover:bg-primary/10`;
const iconButton =
  'flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getTranslations('siteHeader');
  const brand = locale === 'en' ? 'Eshop' : 'ایشاپ';
  const discoverLabel = locale === 'en' ? 'Discover' : locale === 'ps' ? 'کشف' : 'کشف';
  const storesLabel = locale === 'en' ? 'Stores' : locale === 'ps' ? 'پلورنځي' : 'فروشگاه‌ها';
  const discountsLabel = locale === 'en' ? 'Discounts' : locale === 'ps' ? 'تخفیفونه' : 'تخفیف‌ها';
  const brandsLabel = locale === 'en' ? 'Brands' : locale === 'ps' ? 'برانډونه' : 'برندها';
  const traditionalLabel = locale === 'en' ? 'Traditional products' : locale === 'ps' ? 'کورني محصولات' : 'محصولات وطنی';
  const wishlistLabel = locale === 'en' ? 'Wishlist' : locale === 'ps' ? 'خوښې' : 'علاقه‌مندی‌ها';

  return (
    <header className="sticky top-0 z-50 w-full" role="banner">
      <AnnouncementBar locale={locale} />
      <div className="site-header border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="mx-auto max-w-screen-xl px-2.5 sm:px-6">
          <div className="relative flex min-h-[4rem] items-center gap-1.5 sm:min-h-[4.75rem] sm:gap-3">
            <Link href="/" className="group flex shrink-0 items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={t('logoAria')}>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20 transition-transform duration-150 group-hover:scale-[1.02] sm:h-10 sm:w-10" aria-hidden="true"><EshopLogo size={28} variant="color" /></div>
              <div className="hidden flex-col ps-2 sm:flex"><span className="font-display text-[15px] font-extrabold leading-none tracking-tight text-foreground">{brand}</span><span className="mt-0.5 text-[9px] font-semibold uppercase leading-tight tracking-wide text-primary">{t('brandSubline')}</span></div>
            </Link>

            <nav aria-label={discoverLabel} className="hidden min-w-0 max-w-[48vw] shrink lg:flex lg:overflow-x-auto lg:no-scrollbar xl:max-w-none">
              <div className="flex shrink-0 items-center gap-1.5">
                <Link href="/discover" className={navLinkPrimary}><Compass className="h-4 w-4" aria-hidden="true" />{discoverLabel}</Link>
                <Link href="/stores" className={navLinkQuiet}><Store className="h-4 w-4" aria-hidden="true" />{storesLabel}</Link>
                <Link href="/discounts" className={navLinkQuiet}><Tags className="h-4 w-4" aria-hidden="true" />{discountsLabel}</Link>
                <Link href="/brands" className={navLinkQuiet}><Sparkles className="h-4 w-4" aria-hidden="true" />{brandsLabel}</Link>
                <Link href="/traditional" className={navLinkAccent}><Sparkles className="h-4 w-4" aria-hidden="true" />{traditionalLabel}</Link>
              </div>
            </nav>

            <div className="flex min-w-0 flex-1 items-center"><HeaderSearchBar locale={locale} /></div>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
              <Link href="/wishlist" aria-label={wishlistLabel} title={wishlistLabel} className={iconButton}><Heart className="h-4 w-4" aria-hidden="true" /></Link>
              <LanguageSwitcher />
              <ThemeToggle variant="icon" lang={locale} />
              <div className="hidden md:flex"><HeaderAuthActions /></div>
            </div>
          </div>
        </div>
      </div>
      <HeaderCategoryNav />
    </header>
  );
}
