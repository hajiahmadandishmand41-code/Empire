'use client';

import * as React from 'react';
import { StarRating } from './star-rating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * ReviewForm — Phase 6.
 *
 * Client-side form that POSTs to `/api/products/:slug/reviews`.
 * Requires an authenticated session; when the API responds 401
 * the component renders a soft prompt to sign in.
 *
 * On success it dispatches a `empire:review-submitted` window
 * event so a sibling `<ReviewList slug=...>` reloads.
 */
export interface ReviewFormProps {
  slug: string;
  className?: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ slug, className, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = React.useState<number>(0);
  const [title, setTitle] = React.useState('');
  const [comment, setComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (rating < 1) {
        setError('لطفاً یک امتیاز انتخاب کنید');
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(slug)}/reviews`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            rating,
            title: title.trim() || undefined,
            comment: comment.trim() || undefined,
          }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok) {
          if (res.status === 401) {
            throw new Error('برای ارسال نظر ابتدا وارد حساب کاربری خود شوید.');
          }
          throw new Error(json?.error?.message ?? 'ارسال نظر ناموفق بود');
        }
        setSuccess(true);
        setTitle('');
        setComment('');
        setRating(0);
        window.dispatchEvent(new CustomEvent('empire:review-submitted', { detail: { slug } }));
        onSubmitted?.();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSubmitting(false);
      }
    },
    [rating, title, comment, slug, onSubmitted],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6',
        className,
      )}
      aria-labelledby="review-form-title"
    >
      <h3 id="review-form-title" className="font-display text-lg font-semibold text-navy-800">
        ارسال نظر درباره محصول
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        تجربه خود را با دیگران به اشتراک بگذارید تا به خریداران بیشتری کمک کنید.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm font-medium">امتیاز شما</span>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div className="mt-4 space-y-3">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 120))}
          placeholder="عنوان نظر (اختیاری)"
          maxLength={120}
          aria-label="عنوان نظر"
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 2000))}
          placeholder="نقاط مثبت و منفی محصول را بنویسید..."
          maxLength={2000}
          rows={4}
          aria-label="متن نظر"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {success && !error && (
        <p role="status" className="mt-3 text-sm text-emerald-600">
          ممنون! نظر شما با موفقیت ثبت شد.
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'در حال ارسال…' : 'ارسال نظر'}
        </Button>
      </div>
    </form>
  );
}
