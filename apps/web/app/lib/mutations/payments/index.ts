import { useMutation, useQueryClient } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import type {
  ApiRequestOptions,
  CardPaymentRequest,
  CardPaymentResponse,
  PixPaymentRequest,
  PixPaymentResponse,
} from '../../api/types';

export function useCreatePixPaymentMutation(options?: { requestOptions?: ApiRequestOptions }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PixPaymentRequest): Promise<PixPaymentResponse> =>
      defaultApiClient.createPixPayment(data, options?.requestOptions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all() });
      if (data.id) {
        queryClient.setQueryData(queryKeys.payments.detail(data.id), data);
      }
    },
  });
}

export function useCreateCardPaymentMutation(options?: { requestOptions?: ApiRequestOptions }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CardPaymentRequest): Promise<CardPaymentResponse> =>
      defaultApiClient.createCardPayment(data, options?.requestOptions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all() });
      if (data.id) {
        queryClient.setQueryData(queryKeys.payments.detail(data.id), data);
      }
    },
  });
}
