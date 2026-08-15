'use client';

import * as React from 'react';
import { StarRating } from './star-rating';
import type { Review, ProductRatingSummary } from '@/types';

/**
 * ReviewList — Phase 6.
 *
 * Fetches approved reviews for a product slug and renders:
 *  - aggregate rating summary (average + count + histogram)
 *  - a scrollable list of individual reviews
 *
 * Kept as a plain client component so it can drop into either the
 * existing server-rendered product page or a future SPA route.
 */
export interface ReviewListProps {
  slug: string;
  emptyLabel?: string;
  className?: string;
}

interface ReviewsResponse {
  reviews: Review[];
  summary: ProductRatingSummary;
}

export function ReviewList({
  slug,
  emptyLabel = 'هنوز نظری ثبت نشده است. اولین نفر باشید!',
  className,
}: ReviewListProps) {
  const [state, setState] = React.useState<{
    loading: boolean;
    data?: ReviewsResponse;
    error?: string;
  }>({ loading: true });

  const load = React.useCallback(async () => {
    setState({ loading: true });
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(slug)}/reviews`);
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error?.message ?? 'بارگذاری نظرات ناموفق بود');
      setState({ loading: false, data: json.data });
    } catch (err) {
      setState({ loading: false, error: (err as Error).message });
    }
  }, [slug]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Re-load when a sibling form dispatches a "review submitted" event.
  React.useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<{ slug: string }>).detail?.slug === slug) void load();
    };
    window.addEventListener('empire:review-submitted', handler as EventListener);
    return () =>
      window.removeEventListener('empire:review-submitted', handler as EventListener);
  }, [slug, load]);

  if (state.loading) {
    return (
      <div className={className} aria-busy="true">
        <p className="text-sm text-muted-foreground">در حال بارگذاری نظرات…</p>
      </div>
    );
  }
  if (state.error) {
    return (
      <div className={className}>
        <p className="text-sm text-destructive">{state.error}</p>
      </div>
    );
  }
  const data = state.data!;

  return (
    <section aria-labelledby="reviews-heading" className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="reviews-heading" className="font-display text-xl font-semibold text-navy-800">
          نظرات مشتریان
        </h2>
        <div className="flex items-center gap-3">
          <StarRating value={data.summary.average} />
          <span className="text-sm text-muted-foreground">
            {data.summary.average.toFixed(1)} · {data.summary.count} نظر
          </span>
        </div>
      </div>

      {/* Histogram */}
      {data.summary.count > 0 && (
        <ul className="mt-4 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const n = data.summary.distribution[star as 1 | 2 | 3 | 4 | 5] ?? 0;
            const pct = data.summary.count === 0 ? 0 : (n / data.summary.count) * 100;
            return (
              <li key={star} className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="w-8 tabular-nums">{star}★</span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 start-0 rounded-full bg-yellow-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-end tabular-nums">{n}</span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Reviews list */}
      <ul className="mt-6 divide-y divide-border">
        {data.reviews.length === 0 && (
          <li className="py-4 text-sm text-muted-foreground">{emptyLabel}</li>
        )}
        {data.reviews.map((r) => (
          <li key={r.id} className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-navy-800">{r.author.fullName}</p>
                <StarRating value={r.rating} size="sm" />
              </div>
              <time
                className="text-xs text-muted-foreground"
                dateTime={r.createdAt}
              >
                {new Date(r.createdAt).toLocaleDateString('fa-IR')}
              </time>
            </div>
            {r.title && (
              <p className="mt-2 text-sm font-medium text-foreground">{r.title}</p>
            )}
            {r.comment && (
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {r.comment}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
