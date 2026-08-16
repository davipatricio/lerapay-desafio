import type { FetchOptions } from 'ofetch';

/**
 * Standard API error response envelope matching NestJS formatting.
 */
export interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  correlationId?: string;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
  message?: string | string[];
}

/**
 * Request options for API client methods.
 */
export interface ApiClientOptions {
  /** Optional base URL override */
  baseUrl?: string;
  /** Inbound Request object when invoked inside SSR route loaders */
  request?: Request;
  /** Explicit correlation ID to propagate */
  correlationId?: string;
  /** Explicit Bearer auth token */
  token?: string;
  /** Token resolver callback (e.g. from state management or cookies) */
  getToken?: () => string | undefined | null | Promise<string | undefined | null>;
}

export interface ApiRequestOptions extends Omit<FetchOptions<'json'>, 'method' | 'body'> {
  correlationId?: string;
  token?: string;
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Domain Data Transfer Objects (DTOs)
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  database: 'connected' | 'disconnected' | string;
}

export interface GatewayAccountSummaryDto {
  codeClient?: string | null;
  chaveLoja?: string | null;
  isLinked: boolean;
  tokenExpiresAt?: string | null;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  document: string;
  phone?: string;
  personType: 'PF' | 'PJ';
  tradingName?: string;
  gatewayAccount?: GatewayAccountSummaryDto;
  createdAt: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  document: string;
  phone: string;
  personType?: 'PF' | 'PJ';
  tradingName?: string;
  zipCode: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  autoRegisterGateway?: boolean;
}

export interface LinkGatewayRequest {
  document: string;
  gatewayPassword: string;
}

export interface ResetPasswordRequest {
  document?: string;
  email?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserDto;
  message?: string;
}

export interface WalletDto {
  balance: number;
  blockedBalance: number;
  currency: string;
}

export interface TransactionDto {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  type: string;
  status: 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | string;
  externalReference?: string;
  description?: string;
  createdAt: string;
}

export interface TransactionFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface FeeDto {
  brand: string;
  installments: number;
  feePercent: number;
}

export interface PixPaymentRequest {
  amount: number;
  payerDocument: string;
  description?: string;
  checkoutLinkId?: string;
  externalReference?: string;
}

export interface PixPaymentResponse {
  success?: boolean;
  orderId?: string;
  id?: string;
  externalReference: string;
  amount: number;
  method: 'PIX';
  status: string;
  qrCodeBase64?: string;
  qrCode?: string;
  txid?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface CardPaymentRequest {
  amount: number;
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  brand: 'VISA' | 'MASTERCARD' | 'ELO';
  installments: number;
  feePercent: number;
  description?: string;
  checkoutLinkId?: string;
  externalReference?: string;
}

export interface CardPaymentResponse {
  success?: boolean;
  orderId?: string;
  id?: string;
  transactionId?: string;
  externalReference: string;
  amount: number;
  method: 'CREDIT_CARD';
  status: string;
  installments?: number;
  feePercent?: number;
  fee?: number;
  netAmount?: number;
  createdAt?: string;
}

export interface CheckoutLinkRequest {
  title: string;
  amount: number;
  allowedMethods: ('PIX' | 'CREDIT_CARD')[];
  maxInstallments?: number;
  expiresAt?: string;
}

export interface CheckoutLinkDto {
  id: string;
  externalReference: string;
  title: string;
  amount: number;
  allowedMethods: string[];
  maxInstallments?: number;
  status: 'ACTIVE' | 'EXPIRED' | 'COMPLETED';
  url?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CheckoutPaymentStatusDto {
  orderId: string;
  externalReference: string;
  amount: number;
  method: 'PIX' | 'CREDIT_CARD';
  status: string;
  expiresAt?: string;
}

export interface WithdrawalRequest {
  amount: number;
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
}

export interface WithdrawalDto {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;
  pixKey: string;
  createdAt: string;
}

export type WebhookEvent = 'PAYMENT_PIX' | 'PAYMENT_CARD' | 'WITHDRAWAL';

export interface WebhookDto {
  id: string;
  event: WebhookEvent;
  url: string;
  secret?: string;
  createdAt: string;
}

export interface UpsertWebhookRequest {
  url: string;
  event: WebhookEvent;
}
