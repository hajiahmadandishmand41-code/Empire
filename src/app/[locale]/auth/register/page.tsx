'use client';

import { User, ShieldCheck } from 'lucide-react';
import { useLocale } from 'next-intl';
import { AuthForm } from '@/features/auth';

export default function RegisterPage() {
  const locale = useLocale();

  return (
    <main id="main" className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8" aria-labelledby="register-title">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10" aria-hidden="true">
              <User className="h-6 w-6 text-primary" />
            </div>
            <h1 id="register-title" className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              {locale === 'en' ? 'Create your EmpireShop account' : locale === 'ps' ? 'خپل EmpireShop حساب جوړ کړئ' : 'ایجاد حساب در EmpireShop'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {locale === 'en' ? 'Create a secure account to shop faster and track your orders.' : locale === 'ps' ? 'خوندي حساب جوړ کړئ، چټک پیرود وکړئ او خپل سپارښتنې تعقیب کړئ.' : 'حساب امن بسازید، سریع‌تر خرید کنید و سفارش‌های خود را پیگیری کنید.'}
            </p>
          </div>

          <AuthForm mode="register" />
        </section>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
          <span>{locale === 'en' ? 'Your credentials are sent securely.' : locale === 'ps' ? 'ستاسو معلومات په خوندي ډول لېږل کېږي.' : 'اطلاعات ورود شما به‌صورت امن ارسال می‌شود.'}</span>
        </div>
      </div>
    </main>
  );
}
