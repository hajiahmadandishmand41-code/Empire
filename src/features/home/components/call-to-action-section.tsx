import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { ArrowLeft, Store, Users, TrendingUp, CheckCircle } from 'lucide-react';

const benefits = [
  'ثبت‌نام و شروع فروش کاملاً رایگان',
  'بدون کارمزد در ماه اول',
  'پشتیبانی اختصاصی برای فروشندگان',
  'واریز تسویه هفتگی',
];

export function CallToActionSection() {
  return (
    <section aria-label="فروشنده شوید" className="relative overflow-hidden bg-gray-950 py-14 sm:py-20">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 end-0 h-96 w-96 rounded-full bg-rose-600/10 blur-3xl" />
        <div className="absolute bottom-0 start-0 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <Container size="xl">
        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-2 items-center">
          {/* Left / Main CTA */}
          <div className="space-y-5">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-600/15 px-4 py-1.5 text-xs font-bold text-rose-400">
              <Store className="h-3.5 w-3.5" aria-hidden />
              فرصت کسب‌وکار ویژه
            </span>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white sm:text-4xl leading-tight">
                کسب‌وکار خود را
                <span className="block text-rose-400 mt-1">آنلاین کنید</span>
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed max-w-md">
                به بیش از ۵۰۰ فروشنده موفق در EmpireShop بپیوندید. محصولاتتان را به سراسر افغانستان بفروشید و از پشتیبانی حرفه‌ای ما بهره‌مند شوید.
              </p>
            </div>

            {/* Benefits */}
            <ul className="space-y-2">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3 flex-wrap pt-1">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white hover:bg-rose-700 transition-all hover:-translate-y-0.5 shadow-lg shadow-rose-900/40 active:scale-95"
              >
                <Store className="h-4 w-4" aria-hidden />
                تماس با مدیریت
                <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-6 py-3 text-sm font-semibold text-gray-300 hover:border-gray-500 hover:text-white transition-all hover:-translate-y-0.5"
              >
                اطلاعات بیشتر
              </Link>
            </div>
          </div>

          {/* Right / Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Store, value: '+۵۰۰', label: 'فروشنده فعال', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
              { icon: Users, value: '+۵۰,۰۰۰', label: 'مشتری فعال', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { icon: TrendingUp, value: '٪۰', label: 'کارمزد اولیه', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            ].map(({ icon: Icon, value, label, color, bg }) => (
              <div key={label} className={`text-center p-5 rounded-2xl border ${bg} transition-all hover:-translate-y-1`}>
                <Icon className={`h-7 w-7 mx-auto mb-2.5 ${color}`} aria-hidden />
                <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-1 leading-snug">{label}</p>
              </div>
            ))}

            {/* Extra info card */}
            <div className="col-span-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-xs text-gray-400 leading-relaxed">
                🔒 اطلاعات شما کاملاً محرمانه نگهداری می‌شود. درخواست ظرف ۲۴ ساعت بررسی خواهد شد.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
