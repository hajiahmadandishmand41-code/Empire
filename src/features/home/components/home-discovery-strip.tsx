import { Store, Tags, BadgeCheck, Sparkles, Compass } from 'lucide-react';
import { Link } from '@/i18n/routing';

type Locale = 'fa' | 'ps' | 'en';

export function HomeDiscoveryStrip({ locale }: { locale: Locale }) {
  const copy = locale === 'en'
    ? { items: [
        { href: '/stores', label: 'Stores', icon: Store },
        { href: '/brands', label: 'Brands', icon: BadgeCheck },
        { href: '/discounts', label: '20%+ Discounts', icon: Tags },
        { href: '/traditional', label: 'Local Products', icon: Sparkles },
        { href: '/discover', label: 'Discover', icon: Compass },
      ] }
    : locale === 'ps'
      ? { items: [
          { href: '/stores', label: 'پلورنځي', icon: Store },
          { href: '/brands', label: 'برانډونه', icon: BadgeCheck },
          { href: '/discounts', label: '۲۰٪+ تخفیفونه', icon: Tags },
          { href: '/traditional', label: 'وطني محصولات', icon: Sparkles },
          { href: '/discover', label: 'کشف', icon: Compass },
        ] }
      : { items: [
          { href: '/stores', label: 'فروشگاه‌ها', icon: Store },
          { href: '/brands', label: 'برندها', icon: BadgeCheck },
          { href: '/discounts', label: 'تخفیف ۲۰٪+', icon: Tags },
          { href: '/traditional', label: 'محصولات وطنی', icon: Sparkles },
          { href: '/discover', label: 'کشف', icon: Compass },
        ] };

  return (
    <section aria-label={locale === 'en' ? 'Quick links' : locale === 'ps' ? 'چټک لینکونه' : 'دسترسی سریع'} className="border-b border-border bg-card/95">
      <div className="mx-auto max-w-screen-xl px-3 py-2 sm:px-6 sm:py-2.5">
        <div className="flex items-center justify-start gap-2 overflow-x-auto pb-0.5 no-scrollbar snap-x snap-mandatory sm:justify-center sm:gap-2.5 text-[10px] font-extrabold text-muted-foreground sm:text-xs">
          {copy.items.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href as never} className="group inline-flex min-h-10 shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-xl border border-border/80 bg-background px-3.5 py-2 shadow-sm transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-px hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4">
              <Icon className="h-4 w-4 text-primary" aria-hidden /><span>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
