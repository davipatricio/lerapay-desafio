import * as React from 'react';

import { cn } from '@/lib/utils';

export interface PageHeaderProps extends Omit<React.ComponentProps<'header'>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small label rendered above the title (e.g. a section/breadcrumb). */
  eyebrow?: React.ReactNode;
  /** Right-aligned action area (buttons, toggles, link). */
  actions?: React.ReactNode;
}

/**
 * Dense fintech page header: eyebrow + title + description on the left,
 * action slot pinned to the right. Wraps the action column on narrow widths.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn('flex flex-wrap items-start justify-between gap-3', className)}
      {...props}
    >
      <div className="grid min-w-0 flex-1 gap-1">
        {eyebrow ? (
          <div
            data-slot="page-header-eyebrow"
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            {eyebrow}
          </div>
        ) : null}
        <h1
          data-slot="page-header-title"
          className="truncate text-lg font-semibold tracking-tight text-foreground"
        >
          {title}
        </h1>
        {description ? (
          <p
            data-slot="page-header-description"
            className="max-w-2xl text-sm text-muted-foreground"
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div data-slot="page-header-actions" className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
