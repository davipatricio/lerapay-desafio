import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Shared full-page loading placeholder used as the Suspense fallback for the
 * dashboard routes. Mirrors the common fintech page shape (header, metric
 * strip, table) so the shell swap is seamless.
 */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-lg" />
        ))}
      </div>

      {/* Table body */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <Skeleton className="h-11 w-full border-b" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full border-b last:border-0" />
        ))}
      </div>
    </div>
  );
}
