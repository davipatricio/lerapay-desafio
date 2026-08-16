'use client';

import { Suspense, type ReactNode } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';

import { ErrorBoundary } from './error-boundary';

export interface QueryBoundaryProps {
  children: ReactNode;
  /** Placeholder rendered while the section's queries are pending. */
  fallback?: ReactNode;
  /** Renders the failure state at card/section scale instead of page scale. */
  compact?: boolean;
}

/**
 * Isolates one dashboard data region so a failing query only replaces that
 * region — not the whole route — and retrying resets just its cached error.
 */
export function QueryBoundary({ children, fallback = null, compact = true }: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} compact={compact}>
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
