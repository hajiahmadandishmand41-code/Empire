import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProductForm } from '@/features/seller/components/product-form';
import { ProductBrandPicker } from '@/features/seller/components/product-brand-picker';
import { getSellerProduct, listSellerCategories } from '@/features/seller/lib/products';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isDatabaseConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';
interface Props { params: Promise<{ locale: string; id: string }> }

export default async function EditSellerProductPage({ params }: Props) {
  const { locale, id } = await params;
  const backHref = `/${locale}/seller/products`;
  const { items: categories } = await listSellerCategories();
  if (!isDatabaseConfigured()) return <div className="space-y-4"><Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />بازگشت</Link><Card className="p-6"><h2 className="font-display text-lg font-semibold text-navy-800">ویرایش در حالت نمایشی در دسترس نیست</h2><p className="mt-2 text-sm text-muted-foreground">برای ویرایش محصولات، پایگاه داده باید پیکربندی شده باشد.</p></Card></div>;
  const user = await getCurrentUser();
  const sellerId = user && user.role === 'seller' ? user.id : undefined;
  const product = await getSellerProduct(id, sellerId);
  if (!product) notFound();
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />بازگشت به فهرست محصولات</Link>
        <div><h2 className="font-display text-2xl font-bold text-navy-800">ویرایش محصول</h2><p className="mt-1 text-sm text-muted-foreground">{product.name}</p></div>
      </header>
      <Card className="p-4 sm:p-6"><ProductForm mode="edit" categories={categories.map((c) => ({ id: c.id, key: c.key, name: c.name }))} initial={{ id: product.id, slug: product.slug, name: product.name, shortDescription: product.shortDescription, description: product.description, price: product.price, compareAtPrice: product.compareAtPrice, categoryId: product.categoryId, inStock: product.inStock, isActive: product.isActive, stockQuantity: product.stockQuantity, images: product.images, primaryImageIndex: product.primaryImageIndex, whatsappNumber: product.whatsappNumber, isTraditional: product.isTraditional, weightKg: product.weightKg, dimensionsJson: product.dimensionsJson, tagsJson: product.tagsJson, attributesJson: product.attributesJson }} backHref={backHref} /></Card>
      <ProductBrandPicker productId={product.id} initialBrandId={product.brandId} />
    </div>
  );
}
