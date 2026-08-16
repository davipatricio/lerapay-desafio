import { queryOptions, useQuery } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import type { DomainQueryOptions } from '../../query/types';
import type { FeeDto } from '../../api/types';

export function feesQueryOptions(brand?: string, options?: DomainQueryOptions) {
  const client = options?.client || defaultApiClient;

  return queryOptions({
    queryKey: queryKeys.fees.byBrand(brand),
    queryFn: ({ signal }): Promise<FeeDto[]> =>
      client.getFees(brand, { ...options?.requestOptions, signal }),
  });
}

export function useFeesQuery(brand?: string, options?: DomainQueryOptions) {
  return useQuery(feesQueryOptions(brand, options));
}
