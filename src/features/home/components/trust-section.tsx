import { getTranslations } from 'next-intl/server';
import { ShieldCheck, Truck, RotateCcw, CreditCard, Headphones, Award } from 'lucide-react';
import { Container } from '@/components/layout/container';
import type { LucideIcon } from 'lucide-react';

const trustItemKeys = [
  {
    key: 'purchase',
    icon: ShieldCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-100 dark:border-emerald-900/50',
    glow: 'hover:shadow-emerald-200/60 dark:hover:shadow-emerald-900/40',
  },
  {
    key: 'shipping',
    icon: Truck,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-100 dark:border-blue-900/50',
    glow: 'hover:shadow-blue-200/60 dark:hover:shadow-blue-900/40',
  },
  {
    key: 'returns',
    icon: RotateCcw,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-100 dark:border-amber-900/50',
    glow: 'hover:shadow-amber-200/60 dark:hover:shadow-amber-900/40',
  },
  {
    key: 'payment',
    icon: CreditCard,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-100 dark:border-violet-900/50',
    glow: 'hover:shadow-violet-200/60 dark:hover:shadow-violet-900/40',
  },
  {
    key: 'support',
    icon: Headphones,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-100 dark:border-rose-900/50',
    glow: 'hover:shadow-rose-200/60 dark:hover:shadow-rose-900/40',
  },
  {
    key: 'sellers',
    icon: Award,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-100 dark:border-indigo-900/50',
    glow: 'hover:shadow-indigo-200/60 dark:hover:shadow-indigo-900/40',
  },
] satisfies Array<{ key: string; icon: LucideIcon; color: string; bg: string; border: string; glow: string }>;

const fallbacks: Record<string, { label: string; sub: string }> = {
  purchase: { label: 'خرید ۱۰۰٪ امن', sub: 'ضمانت اصالت همه محصولات' },
  shipping: { label: 'ارسال سریع', sub: 'به سراسر افغانستان' },
  returns:  { label: 'مرجوعی ۷ روزه', sub: 'بدون سوال، بدون دردسر' },
  payment:  { label: 'پرداخت مطمئن', sub: 'درگاه رمزنگاری‌شده' },
  support:  { label: 'پشتیبانی ۲۴ ساعته', sub: 'همیشه کنار شما هستیم' },
  sellers:  { label: 'فروشندگان تأییدشده', sub: 'کیفیت تضمینی از بهترین‌ها' },
};

export async function TrustSection() {
  const t = await getTranslations('home.trustSection').catch(() => null);

  return (
    <section aria-label="مزایای خرید" className="bg-background border-b border-border py-10 sm:py-12">
      <Container size="xl">
        {/* Section header */}
        <div className="mb-8 text-center">
          <h2 className="text-lg font-extrabold text-foreground sm:text-xl">چرا EmpireShop؟</h2>
          <p className="text-sm text-muted-foreground mt-1.5">شش تعهد ساده برای خریدی مطمئن و راحت</p>
          <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-rose-400 to-rose-600" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {trustItemKeys.map(({ key, icon: Icon, color, bg, border, glow }, i) => {
            const fallback = fallbacks[key];
            let label = fallback.label;
            let sub = fallback.sub;
            if (t) {
              try { label = t(`${key}.label` as Parameters<typeof t>[0]); } catch { /* keep */ }
              try { sub   = t(`${key}.sub`   as Parameters<typeof t>[0]); } catch { /* keep */ }
            }
            return (
              <div
                key={key}
                className={[
                  'flex flex-col items-center gap-3 text-center p-4 rounded-2xl border',
                  'transition-all duration-200 hover:-translate-y-1.5 hover:shadow-md',
                  'animate-fade-in',
                  bg, border, glow,
                ].join(' ')}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg} ring-1 ring-current/10 shadow-sm`}>
                  <Icon className={`h-6 w-6 ${color}`} aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-snug">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
