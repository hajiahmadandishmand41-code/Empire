import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = 'ضمانت اصالت | Empire Shop';
  const description = 'شرایط ضمانت اصالت و سلامت کالا در امپایر شاپ — تضمین کیفیت تمام محصولات';
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/warranty`,
      languages: {
        fa: `${SITE_URL}/fa/warranty`,
        ps: `${SITE_URL}/ps/warranty`,
        en: `${SITE_URL}/en/warranty`,
      },
    },
    openGraph: { title, description, type: 'website', url: `${SITE_URL}/${locale}/warranty` },
    twitter: { card: 'summary', title, description },
  };
}

export default async function WarrantyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  void locale;
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">ضمانت اصالت و سلامت کالا</h1>
      <p className="mt-4 leading-8 text-muted-foreground">
        همه محصولات فروشندگان تأییدشده امپایر شاپ دارای ضمانت اصالت هستند. در
        صورت دریافت کالای غیراصل، هزینه به طور کامل برگردانده می‌شود.
      </p>
      <h2 className="mt-6 text-xl font-bold text-foreground">ضمانت دیجیتال</h2>
      <p className="mt-2 leading-8 text-muted-foreground">
        محصولات دیجیتال و الکترونیکی دارای ضمانت ۶ ماهه در برابر عیب کارخانه هستند.
      </p>
    </main>
  );
}
