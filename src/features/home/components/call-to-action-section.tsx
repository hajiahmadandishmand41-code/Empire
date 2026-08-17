import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { ArrowLeft, Store, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function CallToActionSection() {
  const t = await getTranslations('home.cta');
  const h = await getTranslations('siteHeader');
  const trust = await getTranslations('home.trust.extra');
  const benefits = [trust('support'), trust('returns'), trust('payment')];

  return (
    <section aria-label={h('becomeSeller')} className="relative overflow-hidden bg-gray-950 py-14 sm:py-20">
      <div className="pointer-events-none absolute inset-0"><div className="absolute -top-32 end-0 h-96 w-96 rounded-full bg-rose-600/10 blur-3xl" /><div className="absolute bottom-0 start-0 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" /></div>
      <Container size="xl">
        <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-600/10 px-2.5 py-1 text-[11px] font-semibold leading-none text-rose-300"><Store className="h-3 w-3" aria-hidden />{h('becomeSeller')}</span>
            <div className="space-y-2"><h2 className="text-2xl font-extrabold leading-tight text-white sm:text-4xl">{t('title')}</h2><p className="max-w-md text-sm leading-relaxed text-gray-400">{t('subtitle')}</p></div>
            <ul className="space-y-2">{benefits.map((benefit) => <li key={benefit} className="flex items-center gap-2.5 text-sm text-gray-300"><CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />{benefit}</li>)}</ul>
            <div className="flex flex-wrap items-center gap-3 pt-1"><Link href="/shop" className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-rose-900/40 transition-all hover:-translate-y-0.5 hover:bg-rose-700 active:scale-95">{t('primaryCta')}<ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /></Link><Link href="/about" className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-6 py-3 text-sm font-semibold text-gray-300 transition-all hover:border-gray-500 hover:text-white">{t('secondaryCta')}</Link></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Store, value: t('stats.0.value'), label: t('stats.0.label'), color: 'text-rose-400' },
              { icon: Users, value: t('stats.1.value'), label: t('stats.1.label'), color: 'text-blue-400' },
              { icon: TrendingUp, value: t('stats.2.value'), label: t('stats.2.label'), color: 'text-emerald-400' },
            ].map(({ icon: Icon, value, label, color }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center transition-all hover:-translate-y-1"><Icon className={`mx-auto mb-2.5 h-7 w-7 ${color}`} aria-hidden /><p className={`text-2xl font-extrabold ${color}`}>{value}</p><p className="mt-1 text-xs leading-snug text-gray-400">{label}</p></div>)}
          </div>
        </div>
      </Container>
    </section>
  );
}
