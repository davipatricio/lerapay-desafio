import { useMutation, useQueryClient } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import { setSessionUser } from '../../auth/token';
import type {
  ApiRequestOptions,
  AuthResponse,
  LinkGatewayRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserDto,
} from '../../api/types';

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
    mutationFn: (payload: RegisterRequest | Record<string, unknown>): Promise<AuthResponse> =>
      defaultApiClient.register(payload, options?.requestOptions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all() });
    },
  });
}

export function useLinkGatewayMutation(options?: { requestOptions?: ApiRequestOptions }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LinkGatewayRequest): Promise<UserDto> =>
      defaultApiClient.linkGateway(payload, options?.requestOptions),
    onSuccess: (updatedUser) => {
      setSessionUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.checkout.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all() });
    },
  });
}

export function useResetPasswordMutation(options?: { requestOptions?: ApiRequestOptions }) {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest): Promise<{ success: boolean; message: string }> =>
      defaultApiClient.resetPassword(payload, options?.requestOptions),
  });
}
