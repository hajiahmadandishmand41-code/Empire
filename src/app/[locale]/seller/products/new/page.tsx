import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProductForm } from '@/features/seller/components/product-form';
import { listSellerCategories } from '@/features/seller/lib/products';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function NewSellerProductPage({ params }: Props) {
  const { locale } = await params;
  const { items: categories } = await listSellerCategories();
  const backHref = `/${locale}/seller/products`;

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          بازگشت به فهرست محصولات
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-800">افزودن محصول</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            اطلاعات محصول جدید را وارد کنید.
          </p>
        </div>
      </header>

      <Card className="p-4 sm:p-6">
        <ProductForm
          mode="create"
          categories={categories.map((c) => ({ id: c.id, key: c.key, name: c.name }))}
          backHref={backHref}
        />
      </Card>
    </div>
  );
}
