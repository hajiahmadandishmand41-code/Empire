import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { SellerApplicationForm } from '@/features/seller/components/seller-application-form';
import { getCurrentUser } from '@/lib/auth/current-user';
import { prisma, isDatabaseConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function SellerApplyPage() {
  const locale = await getLocale();
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/seller/apply`)}`);
  }
  if (user.role === 'seller') redirect(`/${locale}/seller`);

  const pending = isDatabaseConfigured()
    ? await prisma.sellerApplication.findFirst({ where: { userId: user.id, status: 'pending' }, orderBy: { createdAt: 'desc' } })
    : null;

  const approved = user.sellerStatus === 'approved';
  const rejected = user.sellerStatus === 'rejected';
  const copy = locale === 'en'
    ? { title: 'Sell on Eshop', pending: 'Your application is under review.', approved: 'Your seller access is already approved.', rejected: 'Your previous application was rejected. You can submit a new application.', intro: 'Create one shop profile and our team will review it before seller access is enabled.' }
    : locale === 'ps'
      ? { title: 'په Eshop کې وپلورئ', pending: 'ستاسو غوښتنلیک د کتنې لاندې دی.', approved: 'ستاسو د پلورونکي لاسرسی لا دمخه تایید شوی.', rejected: 'ستاسو پخوانی غوښتنلیک رد شوی و. نوی غوښتنلیک لېږلی شئ.', intro: 'د پلورنځي معلومات ثبت کړئ؛ زموږ ټیم به یې وڅېړي او بیا به د پلورونکي لاسرسی فعال شي.' }
      : { title: 'در Eshop فروشنده شوید', pending: 'درخواست شما در حال بررسی است.', approved: 'دسترسی فروشندگی شما از قبل تأیید شده است.', rejected: 'درخواست قبلی شما رد شده است؛ می‌توانید درخواست جدید ارسال کنید.', intro: 'اطلاعات فروشگاه را یک‌بار ثبت کنید تا تیم ما بررسی کرده و دسترسی فروشندگی را فعال کند.' };

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh bg-background py-8 sm:py-12">
        <Container size="md">
          <div className="mb-5"><h1 className="text-2xl font-black tracking-tight sm:text-3xl">{copy.title}</h1><p className="mt-2 text-sm text-muted-foreground">{copy.intro}</p></div>
          {approved ? <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">{copy.approved}</div> : pending ? <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"><p className="font-bold">{copy.pending}</p><p className="mt-2 text-sm opacity-80">{pending.shopName}</p></div> : <>{rejected ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200">{copy.rejected}</div> : null}<SellerApplicationForm /></>}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
