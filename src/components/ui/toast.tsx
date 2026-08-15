'use client';

/**
 * Sonner-powered toast surface. Mount once in the root layout, then drive it
 * with `useToast()` (in `@/hooks/use-toast`) or directly via `toast()` from
 * `sonner`.
 *
 * Empire Shop theming: matches brand navy + gold.
 */
import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';

function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error: 'group-[.toaster]:bg-destructive group-[.toaster]:text-white',
          success: 'group-[.toaster]:bg-emerald-600 group-[.toaster]:text-white',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
