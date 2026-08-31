'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, UserRoundPlus } from 'lucide-react';
import { useLocale } from 'next-intl';
import { AuthForm } from '@/features/auth';

export default function RegisterPage() {
  const locale = useLocale();
  const copy = locale === 'en'
    ? { title: 'Create your account', subtitle: 'Join Eshop and manage your purchases in one secure account.', benefits: ['Track orders easily', 'Save your favourite products', 'Shop from verified stores'], back: 'Back to shop', login: 'Already have an account? Sign in' }
    : locale === 'ps'
      ? { title: 'خپل حساب جوړ کړئ', subtitle: 'له Eshop سره یوځای شئ او خپل پیرودونه په یوه خوندي حساب کې اداره کړئ.', benefits: ['سپارښتنې په اسانۍ تعقیب کړئ', 'د خوښې محصولات خوندي کړئ', 'له تایید شوو پلورنځیو پیرود وکړئ'], back: 'هټۍ ته ستنېدل', login: 'لا دمخه حساب لرئ؟ ننوتل' }
      : { title: 'حساب خود را بسازید', subtitle: 'به Eshop بپیوندید و خریدهای خود را در یک حساب امن مدیریت کنید.', benefits: ['پیگیری آسان سفارش‌ها', 'ذخیره محصولات موردعلاقه', 'خرید از فروشگاه‌های تأییدشده'], back: 'بازگشت به فروشگاه', login: 'حساب دارید؟ وارد شوید' };

  return (
    <main id="main" className="relative min-h-[calc(100dvh-8rem)] overflow-hidden bg-gradient-to-b from-primary/[0.08] via-background to-background px-4 py-8 sm:py-12" dir={locale === 'en' ? 'ltr' : 'rtl'}>
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_top,rgba(59,130,246,.14),transparent_34%)]" />
      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="hidden rounded-[2.5rem] border border-border/70 bg-card/70 p-8 shadow-sm backdrop-blur lg:block lg:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary"><Sparkles className="h-3.5 w-3.5" />Eshop</span>
          <h2 className="mt-6 text-3xl font-black leading-tight">{locale === 'en' ? 'A cleaner way to shop.' : locale === 'ps' ? 'د پیرود لپاره اسانه او خوندي تجربه.' : 'یک تجربه ساده و مطمئن برای خرید.'}</h2>
          <p className="mt-4 max-w-md text-sm leading-8 text-muted-foreground">{copy.subtitle}</p>
          <div className="mt-8 space-y-3">{copy.benefits.map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-4 text-sm font-bold"><ShieldCheck className="h-5 w-5 text-emerald-500" />{item}</div>)}</div>
        </section>
        <section className="relative rounded-[2.5rem] border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8" aria-labelledby="register-title">
          <Link href={`/${locale}`} className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"><ArrowRight className="h-4 w-4 rtl:rotate-180" />{copy.back}</Link>
          <div className="mb-7 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserRoundPlus className="h-7 w-7" /></div><h1 id="register-title" className="text-2xl font-black tracking-tight sm:text-3xl">{copy.title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.subtitle}</p></div>
          <AuthForm mode="register" />
          <p className="mt-5 text-center text-xs text-muted-foreground"><Link href={`/${locale}/auth/login`} className="font-bold text-primary hover:underline">{copy.login}</Link></p>
        </section>
      </div>
    </main>
  );
}
