import { queryOptions, useQuery } from '@tanstack/react-query';
import { defaultApiClient } from '../../api/client';
import { queryKeys } from '../../query/keys';
import type { DomainQueryOptions } from '../../query/types';
import type { TransactionDto, TransactionFilters, WalletDto } from '../../api/types';

export function walletBalanceQueryOptions(options?: DomainQueryOptions) {
  const client = options?.client || defaultApiClient;

  return queryOptions({
    queryKey: queryKeys.wallet.balance(),
    queryFn: ({ signal }): Promise<WalletDto> =>
      client.getWallet({ ...options?.requestOptions, signal }),
  });
}

export function useWalletBalanceQuery(options?: DomainQueryOptions) {
  return useQuery(walletBalanceQueryOptions(options));
}

export function walletTransactionsQueryOptions(
  filters?: TransactionFilters,
  options?: DomainQueryOptions,
) {
  const client = options?.client || defaultApiClient;

  return queryOptions({
    queryKey: queryKeys.wallet.transactions(filters),
    queryFn: ({ signal }): Promise<TransactionDto[]> =>
      client.getTransactions(filters, { ...options?.requestOptions, signal }),
  });
}

export function useWalletTransactionsQuery(
  filters?: TransactionFilters,
  options?: DomainQueryOptions,
) {
  return useQuery(walletTransactionsQueryOptions(filters, options));
}
