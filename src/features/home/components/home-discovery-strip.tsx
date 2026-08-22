import { Compass, Store, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/routing';

type Locale = 'fa' | 'ps' | 'en';

export function HomeDiscoveryStrip({ locale }: { locale: Locale }) {
  const copy = locale === 'en'
    ? {
        eyebrow: 'Discover more',
        items: [
          { href: '/categories', label: 'Browse categories', icon: Compass },
          { href: '/stores', label: 'Trusted stores', icon: Store },
          { href: '/traditional', label: 'Afghan local products', icon: Sparkles },
        ],
      }
    : locale === 'ps'
      ? {
          eyebrow: 'نور هم ومومئ',
          items: [
            { href: '/categories', label: 'وېشنیزې وپلټئ', icon: Compass },
            { href: '/stores', label: 'باوري پلورنځي', icon: Store },
            { href: '/traditional', label: 'افغاني کورني محصولات', icon: Sparkles },
          ],
        }
      : {
          eyebrow: 'بیشتر کشف کنید',
          items: [
            { href: '/categories', label: 'دسته‌بندی‌ها', icon: Compass },
            { href: '/stores', label: 'فروشگاه‌های معتبر', icon: Store },
            { href: '/traditional', label: 'محصولات وطنی افغانستان', icon: Sparkles },
          ],
        };

  return (
    <section aria-label={copy.eyebrow} className="overflow-hidden border-b border-border bg-card/90">
      <div className="mx-auto max-w-screen-xl px-3 py-2 sm:px-6 sm:py-2.5">
        <div className="flex min-w-max items-center justify-center gap-2.5 text-[10px] font-bold text-muted-foreground sm:gap-4 sm:text-xs">
          <span className="hidden shrink-0 items-center gap-1.5 text-primary sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse" aria-hidden />
            {copy.eyebrow}
          </span>
          {copy.items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href as never}
              className="group inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-2.5 py-1.5 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-px hover:border-primary/30 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
