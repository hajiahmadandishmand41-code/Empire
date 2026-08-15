import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = 'قوانین و شرایط استفاده | Empire Shop';
  const description = 'قوانین استفاده و شرایط خرید از فروشگاه اینترنتی امپایر شاپ';
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/terms`,
      languages: {
        fa: `${SITE_URL}/fa/terms`,
        ps: `${SITE_URL}/ps/terms`,
        en: `${SITE_URL}/en/terms`,
      },
    },
    openGraph: { title, description, type: 'website', url: `${SITE_URL}/${locale}/terms` },
    twitter: { card: 'summary', title, description },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  void locale;
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10 prose prose-sm rtl:text-right">
      <h1 className="text-3xl font-bold text-foreground">قوانین و شرایط</h1>
      <p className="mt-4 leading-8 text-muted-foreground">
        استفاده از سایت امپایر شاپ به معنای پذیرش این قوانین است. لطفاً پیش از
        خرید این صفحه را به دقت مطالعه نمایید.
      </p>
      <h2 className="mt-6 text-xl font-bold text-foreground">۱. قوانین خرید</h2>
      <p className="mt-2 leading-8 text-muted-foreground">
        کاربران می‌بایست اطلاعات صحیح و دقیق ارائه دهند. Empire Shop حق دارد در
        صورت تخلف، حساب کاربری را محدود یا مسدود نماید.
      </p>
      <h2 className="mt-6 text-xl font-bold text-foreground">۲. مالکیت معنوی</h2>
      <p className="mt-2 leading-8 text-muted-foreground">
        کلیه محتوا، نشانه‌های تجاری و طراحی سایت متعلق به Empire Shop است و هرگونه
        استفاده بدون اجازه ممنوع است.
      </p>
      <h2 className="mt-6 text-xl font-bold text-foreground">۳. تغییرات</h2>
      <p className="mt-2 leading-8 text-muted-foreground">
        امپایر شاپ حق تغییر این قوانین را در هر زمان دارد. تغییرات از زمان انتشار
        لازم‌الاجرا می‌شوند.
      </p>
    </main>
  );
}
