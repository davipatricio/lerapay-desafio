import { queryOptions, useQuery } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import type { DomainQueryOptions } from '../../query/types';
import type { UserDto } from '../../api/types';

export function meQueryOptions(options?: DomainQueryOptions) {
  const client = options?.client || defaultApiClient;

  return queryOptions({
    queryKey: queryKeys.auth.me(),
    queryFn: ({ signal }): Promise<UserDto> => client.getMe({ ...options?.requestOptions, signal }),
  });
}

export function useMeQuery(options?: DomainQueryOptions) {
  return useQuery(meQueryOptions(options));
}
