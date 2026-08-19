import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { CategoryManager } from '@/features/admin/components/category-manager';
import { listAdminCategories } from '@/features/admin/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const t = await getTranslations('admin.categoriesPage');
  const { items } = await listAdminCategories();
  return <div className="space-y-4"><header><h2 className="font-display text-2xl font-bold text-navy-800">{t('title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p></header><Card className="p-4"><CategoryManager initial={items} /></Card></div>;
}
