import type { TransactionFilters } from '../api/types';

/**
 * Hierarchical Query Key Factory for all domain queries across LeraPay BaaS.
 */
export const queryKeys = {
  all: ['lerapay'] as const,

  // Health
  health: {
    all: () => [...queryKeys.all, 'health'] as const,
    status: () => [...queryKeys.health.all(), 'status'] as const,
    ping: () => [...queryKeys.health.all(), 'ping'] as const,
  },

  // Auth & Users
  auth: {
    all: () => [...queryKeys.all, 'auth'] as const,
    me: () => [...queryKeys.auth.all(), 'me'] as const,
  },

  // Wallet & Transactions
  wallet: {
    all: () => [...queryKeys.all, 'wallet'] as const,
    balance: () => [...queryKeys.wallet.all(), 'balance'] as const,
    transactions: (filters?: TransactionFilters) =>
      [...queryKeys.wallet.all(), 'transactions', filters ?? {}] as const,
  },

  // Fees
  fees: {
    all: () => [...queryKeys.all, 'fees'] as const,
    byBrand: (brand?: string) => [...queryKeys.fees.all(), { brand }] as const,
  },

  // Payments
  payments: {
    all: () => [...queryKeys.all, 'payments'] as const,
    detail: (id: string) => [...queryKeys.payments.all(), id] as const,
  },

  // Withdrawals
  withdrawals: {
    all: () => [...queryKeys.all, 'withdrawals'] as const,
    detail: (id: string) => [...queryKeys.withdrawals.all(), id] as const,
  },

  // Webhooks
  webhooks: {
    all: () => [...queryKeys.all, 'webhooks'] as const,
    list: () => [...queryKeys.webhooks.all(), 'list'] as const,
  },
} as const;
