import { useMutation, useQueryClient } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import type { ApiRequestOptions, AuthResponse, UserDto } from '../../api/types';

export function useLoginMutation(options?: { requestOptions?: ApiRequestOptions }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Record<string, unknown>): Promise<AuthResponse> =>
      defaultApiClient.login(credentials, options?.requestOptions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all() });
    },
  });
}

export function useRegisterMutation(options?: { requestOptions?: ApiRequestOptions }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>): Promise<UserDto> =>
      defaultApiClient.register(payload, options?.requestOptions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all() });
    },
  });
}
