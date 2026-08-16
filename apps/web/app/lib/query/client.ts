import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query';
import { ApiClientError } from '../api/errors';

/**
 * Creates a new QueryClient instance with SSR-safe default configuration.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 60s to prevent immediate refetches after SSR hydration
        staleTime: 60 * 1000,
        // Inactive cache entries are retained for 10 minutes
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Do not retry on SSR to avoid blocking the render pipeline
          if (typeof window === 'undefined') {
            return false;
          }

          // Do not retry on client-side 4xx errors
          if (
            error instanceof ApiClientError &&
            error.statusCode >= 400 &&
            error.statusCode < 500
          ) {
            return false;
          }

          return failureCount < 2;
        },
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Returns a singleton QueryClient in the browser, or creates a new one during SSR.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Always create a fresh client on the server per request
    return createQueryClient();
  }

  // Browser runtime: reuse singleton instance
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }

  return browserQueryClient;
}
