'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { statusLabel, ORDER_STATUSES } from './status-badge';
import { cn } from '@/lib/utils';

export function StatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams?.get('status') ?? '';

  function setStatus(next: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (next) params.set('status', next);
    else params.delete('status');
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
      <FilterChip active={!current} onClick={() => setStatus('')} label="همه" />
      {ORDER_STATUSES.map((s) => (
        <FilterChip
          key={s}
          active={current === s}
          onClick={() => setStatus(s)}
          label={statusLabel(s)}
        />
      ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-muted',
      )}
    >
      {label}
    </button>
  );
}
