'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
}

export function Pagination({ page, pageSize, total }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function hrefFor(p: number) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('page', String(p));
    return `${pathname}?${params.toString()}`;
  }

  if (totalPages <= 1) {
    return <div className="text-xs text-muted-foreground">نمایش {total} مورد</div>;
  }

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div className="text-xs text-muted-foreground">
        صفحه {page} از {totalPages} · مجموع {total}
      </div>
      <div className="flex items-center gap-1">
        <PageLink href={hrefFor(Math.max(1, page - 1))} disabled={page <= 1} ariaLabel="Previous">
          <ChevronRight className="h-4 w-4 rtl:hidden" />
          <ChevronLeft className="hidden h-4 w-4 rtl:inline" />
        </PageLink>
        <PageLink
          href={hrefFor(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          ariaLabel="Next"
        >
          <ChevronLeft className="h-4 w-4 rtl:hidden" />
          <ChevronRight className="hidden h-4 w-4 rtl:inline" />
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  ariaLabel,
  children,
}: {
  href: string;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground opacity-50"
        aria-label={ariaLabel}
        aria-disabled="true"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted',
      )}
    >
      {children}
    </Link>
  );
}
