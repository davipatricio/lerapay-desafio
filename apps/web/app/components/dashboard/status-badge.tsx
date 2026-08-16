import * as React from 'react';

import { cn } from '@/lib/utils';
import { getStatusMeta, type StatusTone } from '@/lib/dashboard';

const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
};

const dotClasses: Record<StatusTone, string> = {
  neutral: 'bg-muted-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
};

export interface StatusBadgeProps extends React.ComponentProps<'span'> {
  /** Raw status string resolved via the central STATUS_META maps. */
  status?: string | null;
  /** Explicit tone override (otherwise derived from the status). */
  tone?: StatusTone;
  /** Explicit label override (otherwise derived from the status). */
  label?: React.ReactNode;
  /** Render a small colored status dot before the label. */
  dot?: boolean;
}

/**
 * Semantic status pill. Uses the shared status → { label, tone } maps so every
 * table/row shows the same wording and color for a given status.
 */
export function StatusBadge({
  status,
  tone: toneOverride,
  label: labelOverride,
  dot = true,
  className,
  ...props
}: StatusBadgeProps) {
  const meta = getStatusMeta(status);
  const tone = toneOverride ?? meta.tone;

  return (
    <span
      data-slot="status-badge"
      className={cn(
        'inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          data-slot="status-badge-dot"
          className={cn('size-1.5 shrink-0 rounded-full', dotClasses[tone])}
          aria-hidden="true"
        />
      ) : null}
      {labelOverride ?? meta.label}
    </span>
  );
}
