/**
 * Route-level fallback: render the storefront shell immediately while
 * page data and imagery stream in behind Suspense boundaries.
 */
export default function Loading() {
  return (
    <div className="min-h-dvh bg-background" role="status" aria-live="polite" aria-label="در حال بارگذاری…">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-screen-xl space-y-3 px-3 py-3 sm:px-6">
          <div className="h-4 w-40 animate-pulse rounded-full bg-muted" />
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-muted" />
            <div className="h-12 flex-1 animate-pulse rounded-2xl bg-muted" />
            <div className="hidden h-11 w-11 animate-pulse rounded-full bg-muted sm:block" />
            <div className="hidden h-11 w-11 animate-pulse rounded-full bg-muted sm:block" />
          </div>
        </div>
      </header>

      <main className="min-h-[70vh]">
        <div className="mx-auto max-w-screen-xl px-3 py-2 sm:px-6">
          <div className="flex gap-2 overflow-hidden">
            <div className="h-9 w-36 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="h-9 w-40 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="h-9 w-36 shrink-0 animate-pulse rounded-full bg-muted" />
          </div>
        </div>

        <section className="mx-auto max-w-screen-xl px-3 pt-3 sm:px-6 sm:pt-5" aria-hidden="true">
          <div className="aspect-[1.6/1] min-h-[300px] animate-pulse rounded-[28px] border border-border bg-muted/45 sm:aspect-[2.3/1] sm:min-h-[390px]" />
        </section>

        <section className="border-y border-border bg-card py-6 sm:py-8" aria-hidden="true">
          <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="space-y-2">
                <div className="h-5 w-40 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-64 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />
            </div>
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 w-28 shrink-0 animate-pulse rounded-2xl bg-muted" />)}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
