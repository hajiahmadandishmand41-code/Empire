import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = 'سوالات متداول | Empire Shop';
  const description = 'پرسش‌های پرتکرار درباره خرید، پرداخت، ارسال و مرجوعی در امپایر شاپ';
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/faq`,
      languages: {
        fa: `${SITE_URL}/fa/faq`,
        ps: `${SITE_URL}/ps/faq`,
        en: `${SITE_URL}/en/faq`,
      },
    },
    openGraph: { title, description, type: 'website', url: `${SITE_URL}/${locale}/faq` },
    twitter: { card: 'summary', title, description },
  };
}

const items = [
  {
    q: 'چطور سفارش ثبت کنم؟',
    a: 'محصول را به سبد اضافه کنید، به صفحه تسویه‌حساب بروید و آدرس و روش پرداخت را انتخاب کنید.',
  },
  {
    q: 'روش‌های پرداخت چیست؟',
    a: 'کارت بانکی، درگاه‌های محلی، و در برخی فروشگاه‌ها پرداخت هنگام تحویل.',
  },
  {
    q: 'زمان ارسال چقدر است؟',
    a: 'در کابل معمولاً ۲۴ تا ۴۸ ساعت و در سایر شهرها ۳ تا ۷ روز کاری.',
  },
  {
    q: 'آیا می‌توانم سفارشم را برگردانم؟',
    a: 'بله، در بازه ۷ روز از دریافت، در صورت کالای معیوب یا مغایر با توضیحات، مرجوعی رایگان است.',
  },
  {
    q: 'چطور فروشنده شوم؟',
    a: 'به بخش «فروشنده شوید» بروید، فرم درخواست را تکمیل کنید و پس از تأیید تیم امپایر، پنل فروش در اختیار شما خواهد بود.',
  },
];

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  void locale;
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">سوالات متداول</h1>
      <dl className="mt-8 divide-y divide-border">
        {items.map(({ q, a }) => (
          <div key={q} className="py-5">
            <dt className="font-semibold text-foreground">{q}</dt>
            <dd className="mt-2 text-sm leading-7 text-muted-foreground">{a}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
