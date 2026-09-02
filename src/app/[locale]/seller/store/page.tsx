import { StoreSettingsForm } from '@/features/seller/components/store-settings-form';
export const dynamic='force-dynamic';
export default function StorePage(){return <div className="mx-auto max-w-6xl space-y-5" dir="rtl"><div><h1 className="text-2xl font-black">فروشگاه من</h1><p className="mt-1 text-sm text-muted-foreground">نام، لوگو، بنر، تماس، آدرس و اطلاعات دریافت وجه فروشگاه را مدیریت کنید.</p></div><StoreSettingsForm/></div>}
