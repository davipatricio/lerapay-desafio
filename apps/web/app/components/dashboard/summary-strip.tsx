import * as React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StatusTone } from '@/lib/dashboard';

const toneClasses: Record<StatusTone, string> = {
  neutral: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  info: 'text-info',
};

export interface SummaryItem {
  /** Stable key, used as React key. */
  key: string;
  /** Visually emphasizes a primary metric without changing its type scale. */
  featured?: boolean;
  label: React.ReactNode;
  value: React.ReactNode;
  /** Secondary line (e.g. a delta, a period, or "vs. ontem"). */
  sub?: React.ReactNode;
  /** Icon rendered in a muted chip. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Colors the icon chip when an icon is present. */
  tone?: StatusTone;
  /** Trending indicator: `up`/`down` with a human label. */
  trend?: {
    direction: 'up' | 'down';
    label: React.ReactNode;
    /** When false the trend renders in destructive, otherwise success. */
    positive?: boolean;
  };
}

export interface SummaryStripProps extends React.ComponentProps<'div'> {
  items: SummaryItem[];
  /** Override the responsive column layout. */
  columns?: string;
}

/**
 * Row of dense financial stat cards. Responsive by default: 1 → 2 → 4 columns.
 */
export function SummaryStrip({ items, columns, className, ...props }: SummaryStripProps) {
  return (
    <div
      data-slot="summary-strip"
      className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4', columns, className)}
      {...props}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const positive = item.trend?.positive ?? item.trend?.direction === 'up';
        const TrendIcon = item.trend?.direction === 'up' ? TrendingUp : TrendingDown;
        return (
          <Card
            key={item.key}
            data-slot="summary-item"
            size="sm"
            className={item.featured ? 'border-primary/20 bg-primary/5' : undefined}
          >
            <CardContent className="flex items-start justify-between gap-3">
              <div className="grid min-w-0 gap-1">
                <div
                  data-slot="summary-label"
                  className={cn(
                    'truncate text-xs font-medium text-muted-foreground',
                    item.featured && 'text-primary',
                  )}
                >
                  {item.label}
                </div>
                <div
                  data-slot="summary-value"
                  className={cn(
                    'truncate font-mono text-xl font-semibold tracking-tight text-foreground tabular-nums',
                    item.featured && 'text-primary',
                  )}
                >
                  {item.value}
                </div>
                {item.trend ? (
                  <div data-slot="summary-trend" className="flex items-center gap-1 text-xs">
                    <TrendIcon
                      className={cn('size-3.5', positive ? 'text-success' : 'text-destructive')}
                    />
                    <span
                      className={cn('font-medium', positive ? 'text-success' : 'text-destructive')}
                    >
                      {item.trend.label}
                    </span>
                  </div>
                ) : item.sub ? (
                  <div data-slot="summary-sub" className="truncate text-xs text-muted-foreground">
                    {item.sub}
                  </div>
                ) : null}
              </div>
              {Icon ? (
                <div
                  data-slot="summary-icon"
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted',
                    item.tone ? toneClasses[item.tone] : 'text-muted-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
