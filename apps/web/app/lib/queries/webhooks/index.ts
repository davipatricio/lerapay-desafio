import { queryOptions, useQuery } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import type { DomainQueryOptions } from '../../query/types';
import type { WebhookDto } from '../../api/types';

export function webhooksListQueryOptions(options?: DomainQueryOptions) {
  const client = options?.client || defaultApiClient;

  return queryOptions({
    queryKey: queryKeys.webhooks.list(),
    queryFn: ({ signal }): Promise<WebhookDto[]> =>
      client.listWebhooks({ ...options?.requestOptions, signal }),
  });
}

export function useWebhooksListQuery(options?: DomainQueryOptions) {
  return useQuery(webhooksListQueryOptions(options));
}
