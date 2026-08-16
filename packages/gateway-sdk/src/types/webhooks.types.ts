export interface CreateWebhookDto {
  event: 'PAYMENT_PIX' | 'PAYMENT_CARD' | 'WITHDRAWAL';
  url: string;
  secret?: string;
}

export interface WebhookItem {
  id: string;
  event: 'PAYMENT_PIX' | 'PAYMENT_CARD' | 'WITHDRAWAL';
  url: string;
  secret?: string;
  createdAt: string;
}

export interface DeleteWebhookResponse {
  success: boolean;
  message: string;
}

export interface WebhookPayload {
  event: 'PAYMENT_PIX' | 'PAYMENT_CARD' | 'WITHDRAWAL';
  status: 'APPROVED' | 'DENIED' | 'CANCELLED' | 'EXPIRED';
  transactionId: string;
  externalReference?: string;
  amount: number;
  timestamp: string;
}
