import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { buildWhatsAppUrl, whatsappConfig } from '@/config/site';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = 'تماس با ما | Empire Shop';
  const description = 'راه‌های تماس با تیم پشتیبانی امپایر شاپ — تلفن، واتساپ و ایمیل';
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/contact`,
      languages: {
        fa: `${SITE_URL}/fa/contact`,
        ps: `${SITE_URL}/ps/contact`,
        en: `${SITE_URL}/en/contact`,
      },
    },
    openGraph: { title, description, type: 'website', url: `${SITE_URL}/${locale}/contact` },
    twitter: { card: 'summary', title, description },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  void locale;
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">تماس با ما</h1>
      <p className="mt-4 leading-8 text-muted-foreground">
        برای هرگونه سوال، پیشنهاد یا مشکل با تیم پشتیبانی ما در ارتباط باشید.
      </p>
      <ul className="mt-6 space-y-3 text-muted-foreground text-sm">
        <li>
          📞{' '}
          <a
            href="tel:+93798228441"
            dir="ltr"
            className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            +93 798 228 441
          </a>
        </li>
        {whatsappConfig.enabled && (
          <li>
            💬{' '}
            <a
              href={buildWhatsAppUrl('سلام، سوالی دارم')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              واتساپ پشتیبانی
            </a>
          </li>
        )}
        <li>
          📧{' '}
          <a
            href="mailto:support@empireshop.af"
            className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            support@empireshop.af
          </a>
        </li>
        <li>📍 کابل، افغانستان</li>
      </ul>
    </main>
  );
}
