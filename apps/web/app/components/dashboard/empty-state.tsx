import * as React from 'react';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export interface EmptyStateProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Icon rendered inside a muted chip above the title. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional call-to-action (button/link). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Dense empty state for tables and dashboards, built on the shadcn Empty
 * primitives. Pass `action` for the row-level call to action.
 */
export function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        {Icon ? (
          <EmptyMedia variant="icon">
            <Icon className="size-4" aria-hidden="true" />
          </EmptyMedia>
        ) : null}
        <EmptyContent>
          <EmptyTitle>{title}</EmptyTitle>
          {description ? <EmptyDescription>{description}</EmptyDescription> : null}
        </EmptyContent>
      </EmptyHeader>
      {action ? <div className="mt-1 flex items-center justify-center">{action}</div> : null}
    </Empty>
  );
}
