export interface TransactionItem {
  id: string;
  type: 'PIX' | 'CREDIT_CARD' | 'WITHDRAWAL';
  status: 'APPROVED' | 'DENIED' | 'PENDING' | 'EXPIRED' | 'CANCELLED';
  amount: number; // in centavos
  external_reference?: string;
  created_at: string;
  description?: string;
}

export interface WalletResponse {
  id: string;
  code_client: string;
  chave_loja: string;
  wallet_balance: number; // in centavos
  total_credit: number;
  total_debit: number;
  net_balance: number;
  transactions: TransactionItem[];
}
