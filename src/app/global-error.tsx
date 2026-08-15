'use client';

/**
 * Top-level Next.js App Router error boundary — Stage 5.
 * Uses semantic CSS tokens where possible; inline styles are kept only
 * for the root-level fallback (no CSS files available at this point).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <title>خطای غیرمنتظره | Empire Shop</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            'Vazirmatn, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          background: '#faf6ee',
          color: '#0b1f3a',
          padding: '1.5rem',
        }}
      >
        <main style={{ maxWidth: 440, textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '1.75rem',
            }}
            aria-hidden="true"
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
            خطای غیرمنتظره
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', margin: '0 0 1.5rem', lineHeight: 1.7 }}>
            صفحه بارگذاری نشد. لطفاً دوباره تلاش کنید. اگر مشکل ادامه داشت، با
            پشتیبانی تماس بگیرید.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.65rem 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: '#dc1649',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.opacity = '0.88'; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.opacity = '1'; }}
          >
            تلاش دوباره
          </button>
          {error?.digest && (
            <p style={{ marginTop: '1rem', fontSize: '0.72rem', color: '#9ca3af' }}>
              کد خطا: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
