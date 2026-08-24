import { Store, ArrowLeft } from 'lucide-react';

export function BecomeSellerBanner({ locale = 'fa' }: { locale?: string }) {
  const copy = locale === 'en'
    ? { title: 'Become a verified seller', text: 'List your products, reach new customers, and manage your shop from one place.', cta: 'Open seller application', hint: 'Application form' }
    : locale === 'ps'
      ? { title: 'پلورونکی شئ', text: 'خپل محصولات ثبت کړئ، نوي پیرودونکي ومومئ او خپل پلورنځی له یوه ځایه اداره کړئ.', cta: 'د پلورونکي غوښتنلیک خلاص کړئ', hint: 'د غوښتنلیک فورمه' }
      : { title: 'فروشنده شوید', text: 'محصولات خود را ثبت کنید، مشتریان بیشتری پیدا کنید و فروشگاهتان را حرفه‌ای مدیریت کنید.', cta: 'رفتن به فرم درخواست فروشندگی', hint: 'فرم درخواست فروشندگی' };

  const applicationHref = `/${locale === 'en' || locale === 'ps' ? locale : 'fa'}/seller/apply#seller-application`;

  return (
    <section className="mx-auto max-w-screen-xl px-3 sm:px-6">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-violet-300/20 bg-gradient-to-r from-slate-950 via-indigo-950 to-rose-950 px-4 py-4 text-white shadow-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 text-white ring-1 ring-white/10"><Store className="h-5 w-5" /></span>
          <div className="min-w-0"><h2 className="text-sm font-extrabold sm:text-base">{copy.title}</h2><p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-white/70 sm:text-xs">{copy.text}</p><span className="mt-1 block text-[9px] font-semibold text-rose-200">{copy.hint}</span></div>
        </div>
        <a href={applicationHref} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 transition-transform hover:-translate-y-0.5"><span>{copy.cta}</span><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /></a>
      </div>
    </section>
  );
}
