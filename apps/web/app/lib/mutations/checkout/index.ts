import { useMutation } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import type { ApiRequestOptions, CheckoutLinkDto, CheckoutLinkRequest } from '../../api/types';

export function useCreateCheckoutLinkMutation(options?: { requestOptions?: ApiRequestOptions }) {
  return useMutation({
    mutationFn: (data: CheckoutLinkRequest): Promise<CheckoutLinkDto> =>
      defaultApiClient.createCheckoutLink(data, options?.requestOptions),
  });
}
