'use client';

/**
 * Sonner-backed toast bridge.
 * In foundation phase we rely on sonner's ergonomic `<Toaster />` mounted in
 * the root layout. This file exists so future feature modules have a stable
 * import path: `@/hooks/use-toast`.
 */
import { toast } from 'sonner';

interface ToastInput {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

export function useToast() {
  return {
    toast: ({ title, description, variant = 'default' }: ToastInput) => {
      const handler =
        variant === 'destructive' ? toast.error : variant === 'success' ? toast.success : toast;
      handler(title ?? '', { description });
    },
    success: (message: string, description?: string) => toast.success(message, { description }),
    error: (message: string, description?: string) => toast.error(message, { description }),
    info: (message: string, description?: string) => toast(message, { description }),
    dismiss: () => toast.dismiss(),
  };
}
