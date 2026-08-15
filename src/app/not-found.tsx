import { routing } from '@/i18n/routing';
import { localeDirection } from '@/i18n/routing';

/**
 * Global not-found — Stage 5: semantic HTML, proper accessibility, no inline style.
 * next-intl's middleware will route unknown URLs to the closest locale by default;
 * this falls back to the defaultLocale if none matches.
 */
export default function NotFound() {
  const locale = routing.defaultLocale;
  const dir = localeDirection[locale as keyof typeof localeDirection] ?? 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <head>
        <title>۴۰۴ — صفحه پیدا نشد | Empire Shop</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          body{min-height:100dvh;display:flex;align-items:center;justify-content:center;
            font-family:Vazirmatn,Inter,system-ui,-apple-system,sans-serif;
            background:#faf6ee;color:#0b1f3a;padding:1.5rem;}
          .wrap{max-width:420px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:1.25rem;}
          .crown{font-size:4rem;line-height:1;}
          h1{font-size:1.75rem;font-weight:800;}
          p{font-size:0.95rem;color:#4b5563;line-height:1.7;}
          a{display:inline-flex;align-items:center;padding:.6rem 1.4rem;border-radius:.75rem;
            background:#dc1649;color:#fff;font-weight:700;text-decoration:none;transition:opacity .15s;}
          a:hover{opacity:.88;}
          a:focus-visible{outline:3px solid #dc1649;outline-offset:3px;}
        `}</style>
      </head>
      <body>
        <main className="wrap">
          <div className="wrap">
            <span className="crown" role="img" aria-label="Empire Shop">👑</span>
            <h1>۴۰۴ — صفحه پیدا نشد</h1>
            <p>صفحه‌ای که دنبالش می‌گردید وجود ندارد یا جابجا شده است.</p>
            <a href={`/${locale}`}>بازگشت به Empire Shop</a>
          </div>
        </main>
      </body>
    </html>
  );
}
