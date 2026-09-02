import { BrandManager } from '@/features/seller/components/brand-manager';

export const dynamic = 'force-dynamic';

export default function BrandsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <BrandManager />
    </div>
  );
}
