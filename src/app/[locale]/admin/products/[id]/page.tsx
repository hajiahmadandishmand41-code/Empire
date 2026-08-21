import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { ProductForm } from '@/features/admin/components/product-form';
import { listAdminCategories } from '@/features/admin/lib/queries';

export const dynamic = 'force-dynamic';

type ProductImage = { src: string; alt?: string };

function readProductImages(raw: unknown): ProductImage[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value: unknown) => {
        if (typeof value === 'string') return { src: value };
        if (value && typeof value === 'object' && 'src' in value) {
          const src = String((value as { src: unknown }).src ?? '');
          const alt = (value as { alt?: unknown }).alt;
          return src ? { src, alt: typeof alt === 'string' ? alt : undefined } : null;
        }
        return null;
      })
      .filter(Boolean) as ProductImage[];
  } catch {
    return [];
  }
}

export default async function EditAdminProductPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const t = await getTranslations('admin.productForm');
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    listAdminCategories(),
  ]);
  if (!product) notFound();

  return <ProductForm
    locale={locale}
    categories={categories.items.map((item) => ({ id: item.id, name: item.name }))}
    initial={{ id: product.id, slug: product.slug, name: product.name, shortDescription: product.shortDescription, description: product.description ?? '', price: product.price.toNumber(), currency: product.currency, categoryId: product.categoryId, region: product.region, badge: product.badge ?? '', inStock: product.inStock, images: readProductImages(product.imagesJson) }}
    labels={{ createTitle: t('createTitle'), editTitle: t('editTitle'), name: t('name'), slug: t('slug'), shortDescription: t('shortDescription'), description: t('description'), price: t('price'), currency: t('currency'), category: t('category'), region: t('region'), badge: t('badge'), inStock: t('inStock'), save: t('save'), create: t('create'), back: t('back'), required: t('required'), success: t('success'), error: t('error'), cancel: t('cancel') }}
  />;
}
