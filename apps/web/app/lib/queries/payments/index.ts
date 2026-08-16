import { queryOptions, useQuery } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import type { DomainQueryOptions } from '../../query/types';
import type {
  CardPaymentResponse,
  CheckoutPaymentStatusDto,
  PixPaymentResponse,
} from '../../api/types';

export function paymentDetailQueryOptions(id: string, options?: DomainQueryOptions) {
  const client = options?.client || defaultApiClient;

  return queryOptions({
    queryKey: queryKeys.payments.detail(id),
    queryFn: ({ signal }): Promise<PixPaymentResponse | CardPaymentResponse> =>
      client.getPayment(id, { ...options?.requestOptions, signal }),
    enabled: Boolean(id),
  });
}

export function publicCheckoutPaymentQueryOptions(
  checkoutLinkId: string,
  orderId: string,
  options?: DomainQueryOptions,
) {
  const client = options?.client || defaultApiClient;

  return queryOptions({
    queryKey: [...queryKeys.payments.detail(orderId), 'checkout-link', checkoutLinkId],
    queryFn: ({ signal }): Promise<CheckoutPaymentStatusDto> =>
      client.getPublicCheckoutPayment(checkoutLinkId, orderId, {
        ...options?.requestOptions,
        signal,
      }),
    enabled: Boolean(checkoutLinkId && orderId),
    staleTime: 0,
    refetchInterval: (query) =>
      ['APPROVED', 'DENIED', 'EXPIRED', 'CANCELLED'].includes(query.state.data?.status ?? '')
        ? false
        : 3_000,
  });
}

export function usePaymentDetailQuery(id: string, options?: DomainQueryOptions) {
  return useQuery(paymentDetailQueryOptions(id, options));
}

export function usePublicCheckoutPaymentQuery(
  checkoutLinkId: string,
  orderId: string,
  options?: DomainQueryOptions,
) {
  return useQuery(publicCheckoutPaymentQueryOptions(checkoutLinkId, orderId, options));
}
