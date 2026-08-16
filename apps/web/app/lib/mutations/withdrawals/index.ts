import { useMutation, useQueryClient } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import type { ApiRequestOptions, WithdrawalDto, WithdrawalRequest } from '../../api/types';

export function useCreateWithdrawalMutation(options?: { requestOptions?: ApiRequestOptions }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WithdrawalRequest): Promise<WithdrawalDto> =>
      defaultApiClient.createWithdrawal(data, options?.requestOptions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance() });
      if (data.id) {
        queryClient.setQueryData(queryKeys.withdrawals.detail(data.id), data);
      }
    },
  });
}
