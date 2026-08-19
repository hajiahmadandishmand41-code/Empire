import { getTranslations } from 'next-intl/server';
import { ProductForm } from '@/features/admin/components/product-form';
import { listAdminCategories } from '@/features/admin/lib/queries';

export const dynamic = 'force-dynamic';

export default async function NewAdminProductPage() {
  const t = await getTranslations('admin.productForm');
  const { items } = await listAdminCategories();
  return <ProductForm categories={items.map((item) => ({ id: item.id, name: item.name }))} locale="fa" labels={{ createTitle: t('createTitle'), editTitle: t('editTitle'), name: t('name'), slug: t('slug'), shortDescription: t('shortDescription'), description: t('description'), price: t('price'), currency: t('currency'), category: t('category'), region: t('region'), badge: t('badge'), inStock: t('inStock'), save: t('save'), create: t('create'), back: t('back'), required: t('required'), success: t('success'), error: t('error'), cancel: t('cancel') }} />;
}
