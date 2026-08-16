import { queryOptions, useQuery } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import type { DomainQueryOptions } from '../../query/types';
import type { HealthResponse } from '../../api/types';

/**
 * Query options for health status check. Usable in both SSR loaders and useQuery.
 */
export function healthQueryOptions(options?: DomainQueryOptions) {
  const client = options?.client || defaultApiClient;

  return queryOptions({
    queryKey: queryKeys.health.status(),
    queryFn: ({ signal }): Promise<HealthResponse> =>
      client.getHealth({ ...options?.requestOptions, signal }),
  });
}

/**
 * Hook to consume health status.
 */
export function useHealthQuery(options?: DomainQueryOptions) {
  return useQuery(healthQueryOptions(options));
}

/**
 * Query options for ping check.
 */
export function pingQueryOptions(options?: DomainQueryOptions) {
  const client = options?.client || defaultApiClient;

  return queryOptions({
    queryKey: queryKeys.health.ping(),
    queryFn: ({ signal }): Promise<string> =>
      client.getPing({ ...options?.requestOptions, signal }),
  });
}

/**
 * Hook to consume ping check.
 */
export function usePingQuery(options?: DomainQueryOptions) {
  return useQuery(pingQueryOptions(options));
}
