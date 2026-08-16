import { QueryCache, QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query';
import { isGatewayReauthError, isLocalSessionExpiredError } from '../api/errors';
import { clearSession, markGatewayPending } from '../auth/token';

/**
 * Creates a new QueryClient instance with SSR-safe default configuration.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, _query) => {
        if (isGatewayReauthError(error)) {
          markGatewayPending();
          return;
        }

        if (typeof window !== 'undefined' && isLocalSessionExpiredError(error)) {
          clearSession();
          window.location.assign('/auth/login');
        }
      },
    }),
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
            isLocalSessionExpiredError(error) ||
            isGatewayReauthError(error) ||
            (error && typeof error === 'object' && 'statusCode' in error &&
              Number(error.statusCode) >= 400 && Number(error.statusCode) < 500)
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
