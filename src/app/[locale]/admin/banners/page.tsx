import { BannerManager } from '@/features/admin/components/banner-manager';

export const dynamic = 'force-dynamic';

export default function AdminBannersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">بنرهای صفحه اول</h1>
        <p className="mt-1 text-sm text-muted-foreground">تمام بنرهای Desktop/Mobile، جایگاه، زمان‌بندی، ترتیب و وضعیت نمایش فقط از همین صفحه مدیریت می‌شوند.</p>
      </header>
      <BannerManager />
    </div>
  );
}
