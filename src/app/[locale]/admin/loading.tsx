import { EshopLogo } from '@/components/eshop-logo';

/** Route-level loading UI used during App Router navigations and streamed page transitions. */
export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-hidden bg-background"
      role="status"
      aria-live="polite"
      aria-label="در حال بارگذاری…"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,hsl(var(--primary)/0.12),transparent_36%)]" aria-hidden="true" />
      <div className="absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/[0.08] blur-3xl" aria-hidden="true" />

      <div className="relative flex w-full max-w-sm flex-col items-center px-6 text-center">
        <div className="relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
          <span className="absolute inset-0 rounded-[2rem] border border-primary/15 bg-card/60 shadow-[0_20px_70px_hsl(var(--primary)/0.15)] backdrop-blur-xl" />
          <span className="absolute inset-2 rounded-[1.6rem] border border-primary/10" />
          <span className="absolute inset-0 animate-ping rounded-[2rem] border border-primary/20" style={{ animationDuration: '2.4s' }} />
          <span className="absolute -inset-1 animate-spin rounded-[2.25rem] border border-transparent border-t-primary/70 border-e-primary/20" style={{ animationDuration: '1.7s' }} />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25 sm:h-20 sm:w-20">
            <EshopLogo size={52} variant="color" className="sm:hidden" />
            <EshopLogo size={60} variant="color" className="hidden sm:block" />
          </span>
        </div>

        <div className="mt-7 space-y-2">
          <p className="font-display text-lg font-black tracking-tight text-foreground sm:text-xl">ایشاپ</p>
          <p className="text-xs font-semibold text-muted-foreground sm:text-sm">در حال باز کردن صفحه…</p>
        </div>

        <div className="mt-6 flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
