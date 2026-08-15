import type { ReactNode } from 'react';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { EmpireLogo } from '@/components/empire-logo';

interface Props {
  children: ReactNode;
}

/**
 * Auth layout — wraps login, register, forgot-password, reset-password pages.
 * Stage 5: replaced all hardcoded colors with semantic design tokens.
 */
export default async function AuthLayout({ children }: Props) {
  const locale = await getLocale();

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10"
      dir="rtl"
    >
      {/* Decorative background blobs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </div>

      {/* Logo */}
      <Link
        href={`/${locale}`}
        className="mb-8 flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        aria-label="Empire Shop — رفتن به صفحه اصلی"
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-lg transition-transform group-hover:scale-105"
          aria-hidden="true"
        >
          <EmpireLogo size={30} variant="color" />
        </div>
        <span className="font-display text-lg font-extrabold text-foreground">
          EmpireShop
        </span>
      </Link>

      <div className="relative w-full max-w-md">
        {children}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} EmpireShop — همه حقوق محفوظ است
      </p>
    </div>
  );
}
