import { useState } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { createServerApiClient } from '../lib/api/client';
import { createQueryClient } from '../lib/query/client';
import { healthQueryOptions, useHealthQuery } from '../lib/queries/health';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Database,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import type { Route } from './+types/home';

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = createQueryClient();
  const serverApi = createServerApiClient(request);

  // Server-side prefetch into request-scoped QueryClient
  await queryClient.prefetchQuery(healthQueryOptions({ client: serverApi }));

  return {
    dehydratedState: dehydrate(queryClient),
    serverCorrelationId: serverApi.getCorrelationId(),
  };
}

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'LeraPay - System Health & Dashboard' },
    { name: 'description', content: 'LeraPay BaaS platform integrating Lera Box gateway' },
  ];
}

function HealthCard({ serverCorrelationId }: { serverCorrelationId: string }) {
  const { data, isPending, isError, error, refetch, isFetching, dataUpdatedAt } = useHealthQuery();
  const [refetchCount, setRefetchCount] = useState(0);

  const handleRefresh = async () => {
    setRefetchCount((c) => c + 1);
    await refetch();
  };

  const isDbConnected = data?.database === 'connected';

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="border-b bg-muted/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">System Health & SSR Status</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Hydrated
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Data prefetched server-side during SSR and hydrated with TanStack Query v5
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Refreshing...' : 'Refetch Query'}
        </Button>
      </div>

      <div className="p-6">
        {isPending && (
          <div className="py-8 text-center text-muted-foreground">
            <Activity className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            Loading system metrics...
          </div>
        )}

        {isError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Failed to fetch system health</p>
              <p className="text-xs opacity-90 mt-1">{error?.message || 'Unknown error'}</p>
            </div>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* API Status */}
            <div className="rounded-lg border p-4 bg-background flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">API Gateway</span>
                <Activity className="h-4 w-4" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {data.status}
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">NestJS Backend</p>
            </div>

            {/* Database Status */}
            <div className="rounded-lg border p-4 bg-background flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Database</span>
                <Database className="h-4 w-4" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className={`text-xl font-bold uppercase ${
                    isDbConnected
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {data.database}
                </span>
                {isDbConnected ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">MySQL 8.4 via TypeORM</p>
            </div>

            {/* Uptime */}
            <div className="rounded-lg border p-4 bg-background flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Server Uptime</span>
                <Clock className="h-4 w-4" />
              </div>
              <div className="mt-3">
                <span className="text-xl font-bold font-mono">{Math.round(data.uptime)}s</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Continuous uptime</p>
            </div>

            {/* Last Synced */}
            <div className="rounded-lg border p-4 bg-background flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Last Cache Update</span>
                <RefreshCw className="h-4 w-4" />
              </div>
              <div className="mt-3">
                <span className="text-sm font-medium font-mono">
                  {new Date(dataUpdatedAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Refetches: {refetchCount}</p>
            </div>
          </div>
        )}

        {/* Tracing & Metadata Footer */}
        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground space-y-1 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>SSR Inbound Correlation ID:</span>
            <span className="text-foreground bg-muted px-2 py-0.5 rounded text-[11px]">
              {serverCorrelationId}
            </span>
          </div>
          {data?.timestamp && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span>Server Payload Timestamp:</span>
              <span>{data.timestamp}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <HydrationBoundary state={loaderData.dehydratedState}>
      <main className="min-h-screen bg-muted/20 p-4 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="flex items-center justify-between pb-6 border-b">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">LeraPay BaaS</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Banking as a Service & Payment Processing Gateway Integration
              </p>
            </div>
          </header>

          <HealthCard serverCorrelationId={loaderData.serverCorrelationId} />
        </div>
      </main>
    </HydrationBoundary>
  );
}
