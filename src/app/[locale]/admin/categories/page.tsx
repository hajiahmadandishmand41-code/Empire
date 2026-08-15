import { Card } from '@/components/ui/card';
import { CategoryManager } from '@/features/admin/components/category-manager';
import { listAdminCategories } from '@/features/admin/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const { items, source } = await listAdminCategories();

  return (
    <div className="space-y-4">
      <header>
        <h2 className="font-display text-2xl font-bold text-navy-800">دسته‌بندی‌ها</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ایجاد، ویرایش و حذف دسته‌ها
          {source === 'mock' && <span className="ms-2 text-amber-700">(داده‌های نمایشی)</span>}
        </p>
      </header>

      <Card className="p-4">
        <CategoryManager initial={items} />
      </Card>
    </div>
  );
}
