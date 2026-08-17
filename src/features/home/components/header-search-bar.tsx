'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface HeaderSearchBarProps {
  locale: string;
}

/** Interactive global search trigger. Typing is allowed; Enter submits to /search. */
export function HeaderSearchBar({ locale: _locale }: HeaderSearchBarProps) {
  const t = useTranslations('common');
  const router = useRouter();

  function navigateToSearch(query = '') {
    const q = query.trim();
    const path = q ? `/search?q=${encodeURIComponent(q)}` : '/search';
    router.push(path as Parameters<typeof router.push>[0]);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    navigateToSearch(formData.get('q')?.toString() ?? '');
  }

  return (
    <form role="search" onSubmit={onSubmit} className="w-full" aria-label={t('search')}>
      <div className="group relative w-full">
        <button
          type="submit"
          aria-label={t('search')}
          className="pointer-events-auto absolute start-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-rose-500 group-hover:text-rose-500"
        >
          <Search className="h-4 w-4" aria-hidden />
        </button>
        <input
          type="search"
          name="q"
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-xl border border-border bg-muted/50 py-2.5 ps-10 pe-16 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground hover:border-primary/30 hover:bg-background focus:border-primary/60 focus:bg-background focus:ring-2 focus:ring-primary/10"
          autoComplete="off"
          aria-label={t('searchPlaceholder')}
        />
        <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
          <kbd className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm">Enter</kbd>
        </div>
      </div>
    </form>
  );
}
