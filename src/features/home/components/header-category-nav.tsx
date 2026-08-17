import { getLocale, getTranslations } from 'next-intl/server';
import { Smartphone, Monitor, Headphones, Watch, Camera, Package, ShoppingBag, Shirt, BookOpen, Home as HomeIcon, Dumbbell, Car, Gem, Baby, Utensils } from 'lucide-react';
import { Link } from '@/i18n/routing';

type CategoryKey = 'mobile' | 'computer' | 'audio' | 'wearable' | 'camera' | 'home' | 'fashion' | 'sport' | 'books' | 'auto' | 'accessories' | 'all' | 'traditional' | 'beauty' | 'baby';

const categoryIcons: Record<CategoryKey, React.ComponentType<{ className?: string }>> = { mobile: Smartphone, computer: Monitor, audio: Headphones, wearable: Watch, camera: Camera, home: HomeIcon, fashion: Shirt, sport: Dumbbell, books: BookOpen, auto: Car, accessories: Package, all: ShoppingBag, traditional: Gem, beauty: Utensils, baby: Baby };
const categoryHrefs: Record<CategoryKey, string> = { mobile: '/shop?categoryKey=digital', computer: '/shop?categoryKey=digital', audio: '/shop?categoryKey=electronics', wearable: '/shop?categoryKey=watches', camera: '/shop?categoryKey=electronics', home: '/shop?categoryKey=homeAppliances', fashion: '/shop?categoryKey=clothing', sport: '/shop?categoryKey=sports', books: '/shop?categoryKey=books', auto: '/shop?categoryKey=electronics', accessories: '/shop?categoryKey=electronics', all: '/shop', traditional: '/shop?categoryKey=traditional', beauty: '/shop?categoryKey=beauty', baby: '/shop?categoryKey=baby' };
const CATEGORY_KEYS: CategoryKey[] = ['all','mobile','computer','fashion','home','audio','wearable','sport','beauty','traditional','books','baby','accessories'];

export async function HeaderCategoryNav() {
  const [t, locale] = await Promise.all([getTranslations('categoryNav'), getLocale()]);
  return (
    <nav aria-label={t('ariaLabel')} className="hidden border-b border-border bg-card shadow-none md:block">
      <div className="mx-auto max-w-screen-xl px-6">
        <div className="flex items-center gap-0 overflow-x-auto py-0 no-scrollbar">
          {CATEGORY_KEYS.map((key) => {
            const Icon = categoryIcons[key];
            const isAll = key === 'all';
            const isTraditional = key === 'traditional';
            return (
              <Link key={key} href={categoryHrefs[key] as never} className={[
                'flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-3 text-xs font-medium transition-all',
                isAll ? 'border-rose-500 text-rose-600 dark:border-rose-400 dark:text-rose-300' : isTraditional ? 'border-transparent font-semibold text-emerald-700 hover:border-emerald-500 dark:text-emerald-400 dark:hover:border-emerald-400' : 'border-transparent text-muted-foreground hover:border-rose-500 hover:text-rose-600 dark:hover:border-rose-400 dark:hover:text-rose-300',
              ].join(' ')}>
                <Icon className={['h-3.5 w-3.5', isTraditional ? 'text-emerald-600 dark:text-emerald-400' : ''].join(' ')} aria-hidden="true" />
                <span>{t(key)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
