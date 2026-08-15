import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

/** Generic in-page loading state — used by Shop/Product/Cart while data loads. */
export function LoadingState({ label = 'Loading…', className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground',
        className,
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}
