import { queryOptions, useQuery } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import type { DomainQueryOptions } from '../../query/types';
import type { CheckoutLinkDto } from '../../api/types';

export function checkoutLinksQueryOptions(options?: DomainQueryOptions) {
  const client = options?.client || defaultApiClient;

  return queryOptions({
    queryKey: queryKeys.checkout.list(),
    queryFn: ({ signal }): Promise<CheckoutLinkDto[]> =>
      client.getCheckoutLinks({ ...options?.requestOptions, signal }),
  });
}

export function useCheckoutLinksQuery(options?: DomainQueryOptions) {
  return useQuery(checkoutLinksQueryOptions(options));
}

export function checkoutLinkDetailQueryOptions(id: string, options?: DomainQueryOptions) {
  const client = options?.client || defaultApiClient;

  return queryOptions({
    queryKey: queryKeys.checkout.detail(id),
    queryFn: ({ signal }): Promise<CheckoutLinkDto> =>
      client.getCheckoutLink(id, { ...options?.requestOptions, signal }),
    enabled: Boolean(id),
  });
}

export function useCheckoutLinkDetailQuery(id: string, options?: DomainQueryOptions) {
  return useQuery(checkoutLinkDetailQueryOptions(id, options));
}
