import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'info';
}

const TONE_STYLES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600',
  warning: 'bg-amber-500/10 text-amber-600',
  info: 'bg-sky-500/10 text-sky-600',
};

export function StatCard({ label, value, hint, icon, tone = 'default' }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-navy-800">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        {icon && (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              TONE_STYLES[tone],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
