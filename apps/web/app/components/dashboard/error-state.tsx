import { TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/**
 * Friendly, retryable error placeholder shown by the shell error boundary when
 * a dashboard route fails to render (e.g. a suspense query rejects).
 */
export function ErrorState({ title = 'Algo deu errado', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {message ? <p className="mt-1 max-w-sm text-xs text-muted-foreground">{message}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
