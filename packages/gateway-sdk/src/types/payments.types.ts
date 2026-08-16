import type { FeeTableItem } from './fees.types';

export type { FeeTableItem };

export interface CreatePixPaymentDto {
  amount: number; // in centavos
  description: string;
  payerDocument: string;
  externalReference: string;
}

export interface CreatePixPaymentResponse {
  success: boolean;
  qrCodeBase64: string;
  emv: string;
  txid?: string;
  amount: number;
  description: string;
}

export interface CreateCardPaymentDto {
  amount: number; // in centavos
  description: string;
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  installments: number; // 1-21
  feePercent: number;
}

export interface CreateCardPaymentResponse {
  success: boolean;
  amount: number;
  fee: number;
  netAmount: number;
  transactionId: string;
}

export interface GetFeesParams {
  brand?: 'VISA' | 'MASTERCARD' | 'ELO';
}

export interface PaymentDetailsResponse {
  id: string;
  type: 'PIX' | 'CREDIT_CARD';
  status: 'APPROVED' | 'DENIED' | 'PENDING';
  amount: number;
  fee?: number;
  netAmount?: number;
  externalReference?: string;
  createdAt: string;
}
