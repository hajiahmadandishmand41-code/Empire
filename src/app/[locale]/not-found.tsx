import { Link } from '@/i18n/routing';

export default function LocaleNotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <span className="text-5xl" role="img" aria-label="404">👑</span>
        <h1 className="text-2xl font-extrabold text-foreground">۴۰۴ — صفحه پیدا نشد</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          صفحه‌ای که دنبالش می‌گردید وجود ندارد یا جابجا شده است.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
