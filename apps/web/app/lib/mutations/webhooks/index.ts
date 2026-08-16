import { useMutation, useQueryClient } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import type { ApiRequestOptions, UpsertWebhookRequest, WebhookDto } from '../../api/types';

export function useUpsertWebhookMutation(options?: { requestOptions?: ApiRequestOptions }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpsertWebhookRequest): Promise<WebhookDto> =>
      defaultApiClient.upsertWebhook(data, options?.requestOptions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all() });
    },
  });
}

export function useDeleteWebhookMutation(options?: { requestOptions?: ApiRequestOptions }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<{ success: boolean }> =>
      defaultApiClient.deleteWebhook(id, options?.requestOptions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all() });
    },
  });
}
