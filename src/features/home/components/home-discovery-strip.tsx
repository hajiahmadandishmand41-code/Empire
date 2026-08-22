import { Compass, Store, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/routing';

type Locale = 'fa' | 'ps' | 'en';

export function HomeDiscoveryStrip({ locale }: { locale: Locale }) {
  const copy = locale === 'en'
    ? {
        eyebrow: 'Quick links',
        items: [
          { href: '/categories', label: 'Categories', icon: Compass },
          { href: '/stores', label: 'Stores', icon: Store },
          { href: '/traditional', label: 'Afghan products', icon: Sparkles },
        ],
      }
    : locale === 'ps'
      ? {
          eyebrow: 'چټک لینکونه',
          items: [
            { href: '/categories', label: 'وېشنیزې', icon: Compass },
            { href: '/stores', label: 'پلورنځي', icon: Store },
            { href: '/traditional', label: 'افغاني محصولات', icon: Sparkles },
          ],
        }
      : {
          eyebrow: 'دسترسی سریع',
          items: [
            { href: '/categories', label: 'دسته‌بندی‌ها', icon: Compass },
            { href: '/stores', label: 'فروشگاه‌ها', icon: Store },
            { href: '/traditional', label: 'محصولات وطنی', icon: Sparkles },
          ],
        };

  return (
    <section aria-label={copy.eyebrow} className="border-b border-border bg-card/90">
      <div className="mx-auto max-w-screen-xl px-3 py-2 sm:px-6 sm:py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar snap-x snap-mandatory sm:justify-center sm:gap-4 text-[10px] font-bold text-muted-foreground sm:text-xs">
          {copy.items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href as never}
              className="group inline-flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-full border border-border/80 bg-background/80 px-2.5 py-1.5 transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-px hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
