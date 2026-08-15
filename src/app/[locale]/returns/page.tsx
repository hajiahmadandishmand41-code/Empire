import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = 'مرجوعی و بازگشت کالا | Empire Shop';
  const description = 'شرایط و مراحل مرجوعی کالا — بازگشت ۷ روزه بدون سوال در امپایر شاپ';
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/returns`,
      languages: {
        fa: `${SITE_URL}/fa/returns`,
        ps: `${SITE_URL}/ps/returns`,
        en: `${SITE_URL}/en/returns`,
      },
    },
    openGraph: { title, description, type: 'website', url: `${SITE_URL}/${locale}/returns` },
    twitter: { card: 'summary', title, description },
  };
}

export default async function ReturnsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  void locale;
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">مرجوعی کالا</h1>
      <p className="mt-4 leading-8 text-muted-foreground">
        در صورت دریافت کالای معیوب، ناقص یا مغایر با توضیحات، در بازه ۷ روزه از
        تاریخ دریافت، مرجوعی رایگان پذیرفته می‌شود.
      </p>
      <h2 className="mt-6 text-xl font-bold text-foreground">شرایط مرجوعی</h2>
      <ul className="mt-3 list-disc list-inside space-y-2 text-sm text-muted-foreground">
        <li>محصول باید در پوشش اصلی و بدون آسیب باشد.</li>
        <li>تصویر یا ویدئوی مشکل را به پشتیبانی ارسال کنید.</li>
        <li>هزینه ارسال برگشت برعهده امپایر شاپ است.</li>
        <li>عودت وجه ظرف ۳ روز کاری انجام می‌شود.</li>
      </ul>
    </main>
  );
}
