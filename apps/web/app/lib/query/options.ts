'use client';

import {
  type UseQueryOptions,
  type UseSuspenseQueryOptions,
  useSuspenseQuery,
} from '@tanstack/react-query';

/**
 * Dashboard-scoped query hook that enables React Suspense integration on top
 * of the existing `*QueryOptions` factories. While a query is pending it throws
 * to the nearest `<Suspense>` boundary (the shell's `PageSkeleton`), so pages
 * render with data already present instead of a manual `isLoading` ternary.
 * Kept separate from the shared query layer so `checkout/pay`, auth, and other
 * non-Suspense consumers are unaffected.
 *
 * The cast to `UseSuspenseQueryOptions` is safe: the factory `queryFn`s always
 * provide a real fetcher (never `skipToken`), which is the only union member
 * that suspense mode disallows.
 */
export function useDashboardQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends readonly unknown[],
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  return useSuspenseQuery(
    options as UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  );
}
