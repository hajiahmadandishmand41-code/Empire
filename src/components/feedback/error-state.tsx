import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'خطایی رخ داده است',
  description = 'لطفاً دوباره تلاش کنید.',
  onRetry,
  retryLabel = 'تلاش مجدد',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}
    >
      <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry} className="mt-2 gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
