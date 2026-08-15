import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  color?: string;
  loading?: boolean;
}

export default function StatsCard({ title, value, change, changeLabel, icon, color = 'bg-primary/10 text-primary', loading }: StatsCardProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl p-5 border border-border shadow-sm animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-muted" />
          <div className="w-16 h-5 rounded bg-muted" />
        </div>
        <div className="w-24 h-7 rounded bg-muted mb-1" />
        <div className="w-32 h-4 rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            change > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : change < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-muted text-muted-foreground'
          )}>
            {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(change)}٪
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground mb-0.5">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
      {changeLabel && <p className="text-xs text-muted-foreground/70 mt-1">{changeLabel}</p>}
    </div>
  );
}
