import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'آفلاین',
  description: 'اتصال اینترنت برقرار نیست',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OfflinePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main
      id="main"
      className="min-h-[70vh] grid place-items-center px-6 text-center"
      style={{ background: 'linear-gradient(160deg,#1a0b3d 0%,#4f1d95 100%)', color: '#fff' }}
    >
      <div
        className="max-w-md rounded-3xl p-8"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <div className="text-5xl">📶</div>
        <h1 className="mt-3 text-2xl font-bold">شما آفلاین هستید</h1>
        <p className="mt-2 opacity-80 leading-7">
          اتصال اینترنت برقرار نیست. برخی صفحات ذخیره‌شده در دسترس‌اند. لطفاً اتصال خود را بررسی و
          دوباره تلاش کنید.
        </p>
      </div>
    </main>
  );
}
