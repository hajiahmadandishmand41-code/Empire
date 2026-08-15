'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const MobileMenu = dynamic(
  () => import('./mobile-menu').then((m) => ({ default: m.MobileMenu })),
  { ssr: false },
);

export function MobileMenuTrigger({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="باز کردن منو"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors md:hidden"
      >
        <span className="flex w-5 flex-col gap-1" aria-hidden>
          <span className="h-0.5 w-5 rounded-full bg-current" />
          <span className="h-0.5 w-5 rounded-full bg-current" />
          <span className="h-0.5 w-5 rounded-full bg-current" />
        </span>
      </button>
      {open && <MobileMenu locale={locale} onClose={() => setOpen(false)} />}
    </>
  );
}
