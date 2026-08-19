import { Store, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';

export function BecomeSellerBanner({ locale = 'fa' }: { locale?: string }) {
  const copy = locale === 'en'
    ? { title: 'Become a verified seller', text: 'List your products, reach new customers, and manage your shop from one place.', cta: 'Start selling' }
    : locale === 'ps'
      ? { title: 'پلورونکی شئ', text: 'خپل محصولات ثبت کړئ، نوي پیرودونکي ومومئ او خپل پلورنځی له یوه ځایه اداره کړئ.', cta: 'پلور پیل کړئ' }
      : { title: 'فروشنده شوید', text: 'محصولات خود را ثبت کنید، مشتریان بیشتری پیدا کنید و فروشگاهتان را حرفه‌ای مدیریت کنید.', cta: 'شروع فروش' };

  return (
    <section className="mx-auto max-w-screen-xl px-3 sm:px-6">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-rose-50 px-4 py-4 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/30 dark:via-gray-950 dark:to-rose-950/20 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm"><Store className="h-5 w-5" /></span>
          <div className="min-w-0"><h2 className="text-sm font-extrabold text-foreground sm:text-base">{copy.title}</h2><p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-muted-foreground sm:text-xs">{copy.text}</p></div>
        </div>
        <Link href="/auth/register" as never className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gray-900 px-3.5 py-2.5 text-xs font-bold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-gray-900"><span>{copy.cta}</span><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /></Link>
      </div>
    </section>
  );
}
