import { queryOptions, useQuery } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import type { DomainQueryOptions } from '../../query/types';
import type { WithdrawalDto } from '../../api/types';

export function withdrawalDetailQueryOptions(id: string, options?: DomainQueryOptions) {
  const client = options?.client || defaultApiClient;

  return queryOptions({
    queryKey: queryKeys.withdrawals.detail(id),
    queryFn: ({ signal }): Promise<WithdrawalDto> =>
      client.getWithdrawal(id, { ...options?.requestOptions, signal }),
    enabled: Boolean(id),
  });
}

export function useWithdrawalDetailQuery(id: string, options?: DomainQueryOptions) {
  return useQuery(withdrawalDetailQueryOptions(id, options));
}
