import { LayoutGrid, Sparkles } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

type CategoryKey = 'clothing' | 'digital' | 'homeAppliances' | 'beauty' | 'sports' | 'footwear' | 'baby' | 'books' | 'electronics' | 'watches';

const CATEGORY_KEYS: CategoryKey[] = ['clothing', 'digital', 'homeAppliances', 'beauty', 'sports', 'footwear', 'baby', 'books', 'electronics', 'watches'];

export async function HeaderCategoryNav() {
  const [t, tCategories, locale] = await Promise.all([getTranslations('categoryNav'), getTranslations('home.categories.items'), getLocale()]);
  const traditionalLabel = locale === 'en' ? 'Local products' : locale === 'ps' ? 'کورني محصولات' : 'محصولات وطنی';
  return (
    <nav aria-label={t('ariaLabel')} className="hidden border-b border-border bg-card/90 md:block">
      <div className="mx-auto max-w-screen-xl px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
          <Link href="/categories" className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/8 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{locale === 'en' ? 'Categories' : locale === 'ps' ? 'وېشنیزې' : 'دسته‌بندی‌ها'}</span>
          </Link>
          {CATEGORY_KEYS.map((key) => (
            <Link key={key} href={`/category/${key}`} className="flex shrink-0 items-center rounded-lg px-2.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span>{tCategories(`${key}.title` as Parameters<typeof tCategories>[0])}</span>
            </Link>
          ))}
          <Link href="/traditional" className="ms-auto flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/8 px-3 py-2 text-[11px] font-bold text-primary transition-colors hover:bg-primary/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{traditionalLabel}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
