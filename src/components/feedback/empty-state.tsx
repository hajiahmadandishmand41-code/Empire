import * as React from 'react';
import { PackageOpen, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  Icon?: LucideIcon;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  Icon = PackageOpen,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-20 text-center', className)}
    >
      <Icon className="h-10 w-10 text-muted-foreground/80" aria-hidden />
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
