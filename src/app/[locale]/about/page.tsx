import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = 'درباره ما | Empire Shop';
  const description = 'با فروشگاه امپایر و ماموریت ما آشنا شوید — بزرگ‌ترین مارکت‌پلیس آنلاین افغانستان';
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/about`,
      languages: {
        fa: `${SITE_URL}/fa/about`,
        ps: `${SITE_URL}/ps/about`,
        en: `${SITE_URL}/en/about`,
      },
    },
    openGraph: { title, description, type: 'website', url: `${SITE_URL}/${locale}/about` },
    twitter: { card: 'summary', title, description },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  void locale;
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">درباره ما</h1>
      <p className="mt-4 leading-8 text-muted-foreground">
        امپایر شاپ یک بازار آنلاین است که تولیدکنندگان و فروشندگان محلی افغانستان
        را به مشتریان در سراسر کشور و منطقه متصل می‌کند. ماموریت ما ساده است:
        دسترسی امن، سریع و منصفانه به کالاهای اصیل.
      </p>
      <p className="mt-4 leading-8 text-muted-foreground">
        ما با فروشندگان بومی همکاری می‌کنیم، محصولاتشان را در ویترین دیجیتال
        قرار می‌دهیم و پرداخت، لجستیک و پشتیبانی را برایشان مدیریت می‌کنیم.
      </p>
    </main>
  );
}
