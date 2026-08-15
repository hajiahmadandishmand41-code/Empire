'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Toaster — wraps Sonner's Toaster for convenient use across the app.
 * Use `toast()` from 'sonner' or `useToast()` from '@/hooks/use-toast' to trigger toasts.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
    />
  );
}
