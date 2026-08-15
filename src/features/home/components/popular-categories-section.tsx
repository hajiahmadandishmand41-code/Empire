import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import {
  Smartphone, Monitor, Headphones, Watch, Camera, Shirt,
  Dumbbell, Package, Gem, Home as HomeIcon, BookOpen, Baby,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const popularCategories = [
  { labelKey: 'mobile',      label: 'موبایل و تبلت',     href: '/shop?categoryKey=digital',        icon: Smartphone, color: 'from-blue-400 to-blue-600',      count: '+۲۰۰' },
  { labelKey: 'computer',    label: 'لپ‌تاپ و کامپیوتر', href: '/shop?categoryKey=digital',        icon: Monitor,    color: 'from-indigo-400 to-purple-600',   count: '+۱۵۰' },
  { labelKey: 'audio',       label: 'صدا و تصویر',        href: '/shop?categoryKey=electronics',    icon: Headphones, color: 'from-pink-400 to-rose-600',       count: '+۸۰'  },
  { labelKey: 'wearable',    label: 'ساعت و پوشیدنی',     href: '/shop?categoryKey=watches',        icon: Watch,      color: 'from-amber-400 to-orange-600',    count: '+۶۰'  },
  { labelKey: 'camera',      label: 'دوربین',              href: '/shop?categoryKey=electronics',    icon: Camera,     color: 'from-emerald-400 to-teal-600',    count: '+۴۰'  },
  { labelKey: 'fashion',     label: 'مد و پوشاک',         href: '/shop?categoryKey=clothing',       icon: Shirt,      color: 'from-fuchsia-400 to-purple-600',  count: '+۱۰۰' },
  { labelKey: 'sport',       label: 'ورزش و سلامت',       href: '/shop?categoryKey=sports',         icon: Dumbbell,   color: 'from-red-400 to-rose-600',        count: '+۷۰'  },
  { labelKey: 'home',        label: 'لوازم خانگی',         href: '/shop?categoryKey=homeAppliances', icon: HomeIcon,   color: 'from-green-400 to-emerald-600',   count: '+۱۲۰' },
  { labelKey: 'books',       label: 'کتاب و فرهنگ',       href: '/shop?categoryKey=books',          icon: BookOpen,   color: 'from-cyan-400 to-blue-600',       count: '+۵۰'  },
  { labelKey: 'baby',        label: 'کودک و نوزاد',       href: '/shop?categoryKey=baby',           icon: Baby,       color: 'from-pink-300 to-rose-500',       count: '+۳۰'  },
  { labelKey: 'traditional', label: 'محصولات سنتی',        href: '/shop?categoryKey=digital',        icon: Gem,        color: 'from-emerald-500 to-green-700',   count: '+۴۵'  },
  { labelKey: 'accessories', label: 'لوازم جانبی',         href: '/shop?categoryKey=electronics',    icon: Package,    color: 'from-gray-400 to-gray-600',       count: '+۲۰۰' },
];

export async function PopularCategoriesSection() {
  const tCatNav = await getTranslations('categoryNav').catch(() => null);
  const tHome   = await getTranslations('home.popularCategories').catch(() => null);

  return (
    <section
      aria-labelledby="pop-cats-title"
      className={[
        'border-b py-8',
        // Light mode
        'bg-background border-border',
        // Dark mode — slightly elevated surface so section stands out
        'dark:bg-slate-900/80 dark:border-slate-700/50',
      ].join(' ')}
    >
      <Container size="xl">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="h-5 w-1 rounded-full bg-purple-600" aria-hidden />
          <h2 id="pop-cats-title" className="text-base font-bold text-foreground dark:text-slate-100 sm:text-lg">
            {tHome ? tHome('title') : 'دسته‌بندی‌های محبوب'}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6">
          {popularCategories.map(({ labelKey, label, href, icon: Icon, color, count }) => {
            let displayLabel = label;
            if (tCatNav) {
              try { displayLabel = tCatNav(labelKey as Parameters<typeof tCatNav>[0]); } catch { /* keep fallback */ }
            }
            return (
              <Link
                key={labelKey}
                href={href}
                className={cn(
                  'group flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all',
                  // Light mode
                  'hover:bg-muted/50',
                  // Dark mode — visible resting surface + stronger active/hover state
                  'dark:rounded-xl dark:border dark:border-slate-700/40 dark:bg-slate-800/50',
                  'dark:hover:border-slate-500/60 dark:hover:bg-slate-700/80 dark:active:bg-slate-700',
                )}
              >
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm transition-transform duration-200 group-hover:scale-110 dark:shadow-black/30',
                  color,
                )}>
                  <Icon className="h-6 w-6 text-white" aria-hidden />
                </div>
                <span className={cn(
                  'text-[11px] font-semibold leading-tight transition-colors line-clamp-2',
                  // Light mode
                  'text-foreground group-hover:text-rose-600',
                  // Dark mode — readable base + vivid hover
                  'dark:text-slate-200 dark:group-hover:text-rose-300 dark:group-active:text-rose-300',
                )}>
                  {displayLabel}
                </span>
                <span className="text-[10px] text-muted-foreground dark:text-slate-500">{count}</span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
