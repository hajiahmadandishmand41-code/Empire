/**
 * Route-level loading UI.
 *
 * This used to be a lone centred spinner on an otherwise blank screen, which
 * is what made a slow homepage feel like it had hung ("در حال بارگذاری" and
 * then an error). A skeleton that mirrors the real layout — header bar, hero,
 * category row, product rail — communicates progress and keeps the page from
 * jumping around once the content arrives.
 */
function RailSkeleton() {
  return (
    <div className="section-shell py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-8 w-1.5 rounded-full bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-muted" />
            <div className="h-2.5 w-44 rounded bg-muted/70" />
          </div>
        </div>
        <div className="h-8 w-20 rounded-full bg-muted" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="w-[42vw] flex-none sm:w-[30vw] md:w-[23vw] lg:w-[19vw] xl:w-[15.5rem]">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
              <div className="aspect-square bg-muted" />
              <div className="space-y-2 p-3">
                <div className="h-2.5 w-14 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
                <div className="h-8 w-full rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LocaleLoading() {
  return (
    <div className="min-h-dvh animate-pulse bg-background" role="status" aria-busy="true">
      <span className="sr-only">در حال بارگذاری…</span>

      {/* Header placeholder */}
      <div className="border-b border-border bg-card">
        <div className="section-shell flex min-h-[4rem] items-center gap-3 sm:min-h-[4.75rem]">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-muted" />
          <div className="hidden w-28 space-y-1.5 sm:block">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-2 w-24 rounded bg-muted/70" />
          </div>
          <div className="h-10 flex-1 rounded-xl bg-muted" />
          <div className="hidden gap-1.5 sm:flex">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-10 w-10 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>

      {/* Hero placeholder */}
      <div className="section-shell pt-3 sm:pt-5">
        <div className="h-[260px] rounded-[24px] bg-muted sm:h-[360px] lg:h-[420px]" />
      </div>

      {/* Category row placeholder */}
      <div className="section-shell py-5">
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex w-[92px] flex-none flex-col items-center gap-2">
              <div className="h-[72px] w-[72px] rounded-full bg-muted sm:h-[80px] sm:w-[80px]" />
              <div className="h-2.5 w-14 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      <RailSkeleton />
      <RailSkeleton />
    </div>
  );
}
