import { TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getErrorPresentation } from '@/lib/api/errors';

export interface ErrorStateProps {
  error?: unknown;
  title?: string;
  message?: string;
  onRetry?: () => void;
  /** Makes the card fit a table or card body instead of an entire page. */
  compact?: boolean;
}

/**
 * Friendly, safe error placeholder for failed dashboard routes and data regions.
 */
export function ErrorState({ error, title, message, onRetry, compact = false }: ErrorStateProps) {
  const presentation = error ? getErrorPresentation(error) : undefined;
  const resolvedTitle = title ?? presentation?.title ?? 'Algo deu errado';
  const resolvedMessage = message ?? presentation?.message;
  const canRetry = onRetry && (presentation?.retryable ?? true);

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 text-center ${
        compact ? 'p-6' : 'p-10'
      }`}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{resolvedTitle}</p>
        {resolvedMessage ? (
          <p className="max-w-sm text-xs text-muted-foreground">{resolvedMessage}</p>
        ) : null}
        {presentation?.correlationId ? (
          <p className="text-xs text-muted-foreground">
            Código de atendimento: <span className="font-mono">{presentation.correlationId}</span>
          </p>
        ) : null}
      </div>
      {canRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
