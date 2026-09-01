import { ExternalLink, Store } from 'lucide-react';
import { requireSeller } from '@/lib/auth/roles';
import { Container } from '@/components/layout/container';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function slugify(value: string): string { return value.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, ''); }

export default async function SellerStorefrontManagementPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const seller = await requireSeller({ locale });
  const shopName = seller.sellerShopName ?? seller.fullName;
  const slug = slugify(shopName);
  const publicPath = `/${locale}/store/${encodeURIComponent(slug)}`;
  return <Container size="lg" className="space-y-6 py-2"><header><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/30"><Store className="h-5 w-5 text-emerald-600" /></div><div><h1 className="text-2xl font-black">فروشگاه من</h1><p className="mt-1 text-sm text-muted-foreground">ویترین عمومی فروشگاه خود را ببینید و مدیریت کنید.</p></div></div></header><div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm font-bold">{shopName}</p><p className="mt-1 text-xs text-muted-foreground">آدرس عمومی فروشگاه</p><div className="mt-3 rounded-xl bg-muted/50 px-3 py-2 font-mono text-xs break-all">{publicPath}</div><Link href={publicPath} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"><ExternalLink className="h-3.5 w-3.5" />مشاهده فروشگاه عمومی</Link></div><div className="rounded-2xl border border-border bg-muted/30 p-5"><p className="text-sm font-bold">اطلاعات ویترین</p><p className="mt-1 text-xs leading-6 text-muted-foreground">لوگو، Banner و مشخصات فروشگاه از تنظیمات فروشگاه مدیریت می‌شوند. این صفحه فقط مسیر عمومی را به‌صورت مستقل و قابل اشتراک در اختیار شما می‌گذارد.</p><Link href={`/${locale}/seller/settings`} className="mt-4 inline-flex rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold hover:bg-muted">رفتن به تنظیمات فروشگاه</Link></div></Container>;
}
