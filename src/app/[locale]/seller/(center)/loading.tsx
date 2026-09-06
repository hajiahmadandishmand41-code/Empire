import { EshopLogo } from '@/components/eshop-logo';

/** Route-level loading UI used during App Router navigations and streamed page transitions. */
export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-live="polite" aria-label="در حال بارگذاری…">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" style={{ animationDuration: '1.2s' }} />
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <EshopLogo size={24} variant="color" />
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">در حال بارگذاری…</p>
        </div>
      </div>
    </div>
  );
}
