import { LayoutGrid } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

type CategoryKey = 'clothing' | 'digital' | 'homeAppliances' | 'beauty' | 'sports' | 'footwear' | 'baby' | 'books' | 'electronics' | 'watches';

const CATEGORY_KEYS: CategoryKey[] = ['clothing', 'digital', 'homeAppliances', 'beauty', 'sports', 'footwear', 'baby', 'books', 'electronics', 'watches'];

export async function HeaderCategoryNav() {
  const [tCategories, locale] = await Promise.all([getTranslations('home.categories.items'), getLocale()]);
  const categoriesLabel = locale === 'en' ? 'Categories' : locale === 'ps' ? 'وېشنیزې' : 'دسته‌بندی‌ها';
  return (
    <nav aria-label={categoriesLabel} className="hidden border-b border-border bg-card/90 md:block">
      <div className="mx-auto max-w-screen-xl px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
          <Link href="/categories" className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-black text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" /><span>{categoriesLabel}</span></Link>
          {CATEGORY_KEYS.map((key) => (
            <Link key={key} href={`/category/${key}`} className="flex min-h-9 shrink-0 items-center rounded-lg px-2.5 py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span>{tCategories(`${key}.title` as Parameters<typeof tCategories>[0])}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
