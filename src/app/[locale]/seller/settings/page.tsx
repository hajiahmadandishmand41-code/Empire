import { StoreSettingsForm } from '@/features/seller/components/store-settings-form';
import { requireSeller } from '@/lib/auth/roles';
export const dynamic='force-dynamic';
export default async function SettingsPage({params}:{params:Promise<{locale:string}>}){const{locale}=await params;const u=await requireSeller({locale});return <div className="mx-auto max-w-6xl space-y-5" dir="rtl"><div><h1 className="text-2xl font-black">تنظیمات فروشگاه</h1><p className="mt-1 text-sm text-muted-foreground">حساب فروشنده، اطلاعات عمومی، شبکه‌های اجتماعی و روش‌های دریافت وجه.</p></div><div className="rounded-3xl border bg-card p-4 text-xs text-muted-foreground">حساب فعال: <span className="font-bold text-foreground">{u.email||u.fullName}</span></div><StoreSettingsForm/></div>}
