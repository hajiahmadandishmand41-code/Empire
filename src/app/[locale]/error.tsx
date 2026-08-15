'use client';

import { useEffect } from 'react';
import { Container } from '@/components/layout/container';
import { ErrorState } from '@/components/feedback/error-state';

/**
 * Locale-scoped error boundary. Catches render/data errors under /[locale]
 * and renders a recoverable UI without unmounting the shell.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    
    console.error(error);
  }, [error]);

  return (
    <Container className="py-12">
      <ErrorState onRetry={reset} />
    </Container>
  );
}
