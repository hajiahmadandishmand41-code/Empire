import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProductImportForm } from '@/features/seller/components/product-import-form';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function SellerProductImportPage({ params }: Props) {
  const { locale } = await params;
  const backHref = `/${locale}/seller/products`;
  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          بازگشت به محصولات
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-800">Import محصولات</h2>
          <p className="mt-1 text-sm text-muted-foreground">ثبت تعداد زیادی محصول از فایل CSV بدون ایجاد محصولات تکراری.</p>
        </div>
      </header>
      <Card className="p-0">
        <ProductImportForm />
      </Card>
    </div>
  );
}
