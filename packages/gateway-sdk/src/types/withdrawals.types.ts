export interface CreateWithdrawDto {
  amount: number; // in centavos
  pixKey: string; // email, CPF, phone or EVP
  document: string; // CPF do titular da chave Pix
  description?: string;
  externalReference?: string;
}

export interface CreateWithdrawResponse {
  success: boolean;
  withdrawalId: string;
  status: 'APPROVED' | 'DENIED' | 'PENDING' | 'INSUFFICIENT_BALANCE';
  amount: number;
}

export interface WithdrawalDetailsResponse {
  id: string;
  status: 'APPROVED' | 'DENIED' | 'PENDING' | 'INSUFFICIENT_BALANCE';
  amount: number;
  pixKey?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
