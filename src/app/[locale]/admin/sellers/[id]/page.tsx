import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Mail, Phone, Store, Package, CalendarDays, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SellerActions, SellerStatusBadge } from '@/features/admin/components/seller-actions';
import { getAdminSeller } from '@/features/admin/lib/queries';
import { formatDate } from '@/features/admin/lib/format';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ locale: string; id: string }> }

export default async function AdminSellerDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const seller = await getAdminSeller(id);
  if (!seller) notFound();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <Link href={`/${locale}/admin/sellers`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          بازگشت به فروشندگان
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold text-foreground">جزئیات فروشنده</span>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-gradient-to-l from-primary/10 via-card to-card p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm"><Store className="h-7 w-7" aria-hidden /></div>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2"><SellerStatusBadge status={seller.sellerStatus} />{seller.isActive ? <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700">حساب فعال</span> : <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">حساب غیرفعال</span>}</div>
                  <h1 className="text-2xl font-black text-foreground">{seller.shopName ?? seller.fullName}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{seller.fullName}</p>
                </div>
              </div>
              <SellerActions sellerId={seller.id} status={seller.sellerStatus} isActive={seller.isActive} />
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <InfoItem icon={<Mail className="h-4 w-4" />} title="ایمیل" value={seller.email ?? 'ثبت نشده'} />
            <InfoItem icon={<Phone className="h-4 w-4" />} title="شماره تماس" value={seller.phone ?? 'ثبت نشده'} />
            <InfoItem icon={<Package className="h-4 w-4" />} title="تعداد محصولات" value={seller.productCount.toLocaleString('fa-IR')} />
            <InfoItem icon={<CalendarDays className="h-4 w-4" />} title="تاریخ ثبت" value={formatDate(seller.createdAt)} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" aria-hidden /><h2 className="font-bold">وضعیت اعتماد</h2></div>
          <div className="mt-5 space-y-3">
            <TrustRow label="وضعیت فروشنده" value={seller.sellerStatus === 'approved' ? 'تأیید شده' : seller.sellerStatus === 'pending' ? 'در انتظار بررسی' : seller.sellerStatus === 'rejected' ? 'رد شده' : 'ثبت‌نشده'} />
            <TrustRow label="وضعیت حساب" value={seller.isActive ? 'فعال' : 'غیرفعال'} />
            <TrustRow label="محصولات فعال در Marketplace" value={seller.productCount.toLocaleString('fa-IR')} />
          </div>
          {seller.bio ? <div className="mt-6 rounded-2xl bg-muted/40 p-4"><p className="text-xs font-semibold text-muted-foreground">معرفی فروشگاه</p><p className="mt-2 text-sm leading-7 text-foreground">{seller.bio}</p></div> : null}
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href={`/${locale}/admin/products?q=${encodeURIComponent(seller.shopName ?? seller.fullName)}`} className="rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:bg-muted/30"><Package className="h-5 w-5 text-primary" /><p className="mt-3 font-bold">محصولات فروشنده</p><p className="mt-1 text-xs text-muted-foreground">مشاهده و مدیریت محصولات این فروشنده.</p></Link>
        <Link href={`/${locale}/admin/orders`} className="rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:bg-muted/30"><Store className="h-5 w-5 text-primary" /><p className="mt-3 font-bold">سفارش‌ها</p><p className="mt-1 text-xs text-muted-foreground">رفتن به مرکز مدیریت سفارش‌ها.</p></Link>
        <Link href={`/${locale}/admin/payouts`} className="rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:bg-muted/30"><ShieldCheck className="h-5 w-5 text-primary" /><p className="mt-3 font-bold">برداشت‌ها</p><p className="mt-1 text-xs text-muted-foreground">بررسی وضعیت پرداخت و برداشت فروشندگان.</p></Link>
      </section>
    </div>
  );
}

function InfoItem({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-muted/20 p-4"><div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs font-semibold">{title}</span></div><p className="mt-2 truncate text-sm font-semibold text-foreground">{value}</p></div>;
}

function TrustRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3 text-sm last:border-0 last:pb-0"><span className="text-muted-foreground">{label}</span><span className="font-semibold text-foreground">{value}</span></div>;
}
