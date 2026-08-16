import { useMutation, useQueryClient } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import type { ApiRequestOptions, CheckoutLinkDto, CheckoutLinkRequest } from '../../api/types';

export function useCreateCheckoutLinkMutation(options?: { requestOptions?: ApiRequestOptions }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CheckoutLinkRequest): Promise<CheckoutLinkDto> =>
      defaultApiClient.createCheckoutLink(data, options?.requestOptions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.checkout.all() });
    },
  });
}
