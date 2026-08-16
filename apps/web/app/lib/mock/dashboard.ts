// Mocked dashboard data for UI demonstration.
// Backend wallet/transactions/fees/withdrawals endpoints are not exposed to the
// frontend yet, so we present representative data per .roadmap/ while those are built.

export type TxStatus = 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED' | 'PENDING';

export interface MockTransaction {
  id: string;
  reference: string;
  description: string;
  method: 'PIX' | 'CARD';
  amount: number; // centavos
  fee: number; // centavos
  status: TxStatus;
  createdAt: string;
}

export interface MockCardFee {
  brand: string;
  installments: number;
  feePercent: number;
}

export interface MockCheckoutLink {
  id: string;
  externalReference: string;
  title: string;
  amount: number;
  methods: readonly string[];
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  url: string;
}

export interface MockWithdrawal {
  id: string;
  amount: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  pixKey: string;
  createdAt: string;
}

export interface MockWalletSummary {
  balance: number;
  blockedBalance: number;
  volumeToday: number;
  transactionsToday: number;
  currency: string;
}

export const walletSummary: MockWalletSummary = {
  balance: 4_523_000, // R$ 45.230,00
  blockedBalance: 385_000, // R$ 3.850,00
  volumeToday: 1_289_500, // R$ 12.895,00
  transactionsToday: 148,
  currency: 'BRL',
};

export const recentTransactions: MockTransaction[] = [
  {
    id: '1',
    reference: 'ord_9f2c1a',
    description: 'Checkout #LOJA-0012 · Pix',
    method: 'PIX',
    amount: 2_549_000,
    fee: 0,
    status: 'APPROVED',
    createdAt: '2026-08-15T14:32:00.000Z',
  },
  {
    id: '2',
    reference: 'ord_9f2c1b',
    description: 'Venda com cartão · Visa · 3x',
    method: 'CARD',
    amount: 899_000,
    fee: 35_960,
    status: 'APPROVED',
    createdAt: '2026-08-15T13:05:00.000Z',
  },
  {
    id: '3',
    reference: 'ord_9f2c1c',
    description: 'Checkout #LOJA-0010 · Pix',
    method: 'PIX',
    amount: 120_000,
    fee: 0,
    status: 'EXPIRED',
    createdAt: '2026-08-15T11:44:00.000Z',
  },
  {
    id: '4',
    reference: 'ord_9f2c1d',
    description: 'Venda com cartão · Mastercard · 1x',
    method: 'CARD',
    amount: 315_000,
    fee: 9_450,
    status: 'PENDING',
    createdAt: '2026-08-15T10:20:00.000Z',
  },
  {
    id: '5',
    reference: 'ord_9f2c1e',
    description: 'Checkout #LOJA-0009 · Cartão',
    method: 'CARD',
    amount: 1_490_000,
    fee: 59_600,
    status: 'CANCELLED',
    createdAt: '2026-08-14T18:55:00.000Z',
  },
];

export const cardFees: MockCardFee[] = [
  { brand: 'VISA', installments: 1, feePercent: 3.99 },
  { brand: 'VISA', installments: 2, feePercent: 4.99 },
  { brand: 'VISA', installments: 3, feePercent: 5.49 },
  { brand: 'MASTERCARD', installments: 1, feePercent: 3.99 },
  { brand: 'MASTERCARD', installments: 2, feePercent: 4.99 },
  { brand: 'MASTERCARD', installments: 3, feePercent: 5.49 },
];

export const checkoutLinks: MockCheckoutLink[] = [
  {
    id: '1',
    externalReference: 'LOJA-0012',
    title: 'Produto Premium',
    amount: 2_549_000,
    methods: ['PIX', 'CARD'] as const,
    status: 'ACTIVE' as const,
    url: 'https://pay.lerapay.app/c/LOJA-0012',
  },
  {
    id: '2',
    externalReference: 'LOJA-0011',
    title: 'Consultoria',
    amount: 899_000,
    methods: ['CARD'] as const,
    status: 'COMPLETED' as const,
    url: 'https://pay.lerapay.app/c/LOJA-0011',
  },
];

export const withdrawals: MockWithdrawal[] = [
  {
    id: '1',
    amount: 1_500_000,
    status: 'PROCESSING' as const,
    pixKey: 'joao@example.com',
    createdAt: '2026-08-15T09:00:00.000Z',
  },
  {
    id: '2',
    amount: 2_000_000,
    status: 'COMPLETED' as const,
    pixKey: '11987654321',
    createdAt: '2026-08-12T16:30:00.000Z',
  },
];
