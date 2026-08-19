import { MarketplaceControls } from '@/features/admin/components/marketplace-controls';
export const dynamic='force-dynamic';
export default async function AdminBannersPage({params}:{params:Promise<{locale:string}>}){const {locale}=await params;return <div className="space-y-6"><header><h1 className="text-2xl font-black">بنر و تبلیغات</h1><p className="mt-1 text-sm text-muted-foreground">مدیریت Bannerهای Desktop/Mobile و ترتیب نمایش بدون تغییر کد.</p></header><MarketplaceControls locale={locale}/></div>}
