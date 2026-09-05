import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'info';
}

const TONE_STYLES: Record<NonNullable<StatCardProps['tone']>, { icon: string; border: string }> = {
  default: { icon: 'bg-primary/10 text-primary', border: 'border-border/60' },
  success: { icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/15' },
  warning: { icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', border: 'border-amber-500/15' },
  info:    { icon: 'bg-sky-500/10 text-sky-600 dark:text-sky-400', border: 'border-sky-500/15' },
};

export function StatCard({ label, value, hint, icon, tone = 'default' }: StatCardProps) {
  const styles = TONE_STYLES[tone];
  return (
    <div className={cn('card-luxury rounded-2xl border bg-card p-4 shadow-sm sm:p-5', styles.border)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-black tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', styles.icon)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
