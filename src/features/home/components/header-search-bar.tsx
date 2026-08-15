'use client';

import * as React from 'react';
import { useRef } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface HeaderSearchBarProps {
  locale: string;
}

/**
 * HeaderSearchBar — lightweight trigger bar.
 * Clicking or focusing navigates to the dedicated /search page.
 * Typing and pressing Enter also navigates to /search?q=...
 * Keeps the homepage fast by not loading search logic here.
 */
export function HeaderSearchBar({ locale }: HeaderSearchBarProps) {
  const t = useTranslations('siteHeader');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function navigateToSearch(query?: string) {
    const path = query && query.trim()
      ? `/search?q=${encodeURIComponent(query.trim())}`
      : '/search';
    router.push(path as Parameters<typeof router.push>[0]);
  }

  function onFocus() {
    // Navigate to search page immediately on focus
    navigateToSearch();
    inputRef.current?.blur();
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q')?.toString() ?? '';
    navigateToSearch(q);
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="w-full"
      aria-label="جستجوی محصولات"
    >
      <div className="relative w-full group cursor-pointer">
        {/* Search icon */}
        <div className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 z-10">
          <Search className="h-4 w-4 text-muted-foreground group-hover:text-rose-500 transition-colors duration-200" aria-hidden />
        </div>

        {/* Input — clicking/focusing navigates to search page */}
        <input
          ref={inputRef}
          type="search"
          name="q"
          placeholder={t('searchPlaceholder')}
          onFocus={onFocus}
          className="
            w-full rounded-xl border border-gray-200 dark:border-gray-700
            bg-gray-50 dark:bg-gray-800/70
            py-2.5 ps-10 pe-4
            text-sm text-foreground dark:text-gray-200
            placeholder:text-muted-foreground dark:placeholder:text-muted-foreground
            transition-all duration-200
            outline-none
            hover:border-rose-300 dark:hover:border-rose-700
            hover:bg-white dark:hover:bg-gray-800
            cursor-pointer
            focus:border-rose-400 dark:focus:border-rose-600
            focus:bg-white dark:focus:bg-gray-800
            focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-900/30
          "
          autoComplete="off"
          readOnly
          aria-label={t('searchPlaceholder')}
        />

        {/* Keyboard hint — desktop only */}
        <div className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
          <kbd className="flex h-5 items-center rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-1.5 text-[10px] font-medium text-muted-foreground dark:text-muted-foreground shadow-inner">
            /
          </kbd>
        </div>
      </div>
    </form>
  );
}
