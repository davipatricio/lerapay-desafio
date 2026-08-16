import { ofetch, type $Fetch } from 'ofetch';
import { getApiBaseUrl } from './config';
import { parseApiError } from './errors';
import { getAccessToken } from '../auth/token';
import type {
  ApiClientOptions,
  ApiRequestOptions,
  HealthResponse,
  UserDto,
  RegisterRequest,
  AuthResponse,
  WalletDto,
  TransactionDto,
  TransactionFilters,
  FeeDto,
  LinkGatewayRequest,
  ResetPasswordRequest,
  PixPaymentRequest,
  PixPaymentResponse,
  CardPaymentRequest,
  CardPaymentResponse,
  CheckoutPaymentStatusDto,
  CheckoutLinkRequest,
  CheckoutLinkDto,
  WithdrawalRequest,
  WithdrawalDto,
  WebhookDto,
  UpsertWebhookRequest,
} from './types';

/**
 * Unified HTTP API client for @lerapay/api with correlation ID and auth support.
 */
export class ApiClient {
  private readonly fetcher: $Fetch;
  private readonly baseUrl: string;
  private readonly correlationId: string;
  private readonly options: ApiClientOptions;

  constructor(options: ApiClientOptions = {}) {
    this.options = options;
    this.baseUrl = options.baseUrl || getApiBaseUrl();

    // Extract existing correlation ID from inbound request or generate a new one
    const incomingCorrelationId =
      options.correlationId ||
      options.request?.headers.get('x-correlation-id') ||
      options.request?.headers.get('x-request-id') ||
      options.request?.headers.get('x-correlationid');

    this.correlationId = incomingCorrelationId || crypto.randomUUID();

    this.fetcher = ofetch.create({
      baseURL: this.baseUrl,
      onRequest: async ({ options: reqOptions }) => {
        const headers = new Headers(reqOptions.headers);

        // Always inject correlation ID
        const activeCorrelationId =
          (reqOptions as ApiRequestOptions).correlationId || this.correlationId;
        headers.set('x-correlation-id', activeCorrelationId);

        // Resolve auth token (priority: per-call token -> constructor token -> callback -> request header)
        let token = (reqOptions as ApiRequestOptions).token || this.options.token;
        if (!token && this.options.getToken) {
          const resolved = await this.options.getToken();
          if (resolved) token = resolved;
        }
        if (!token && this.options.request) {
          const authHeader = this.options.request.headers.get('authorization');
          if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7);
          }
        }

        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        reqOptions.headers = headers;
      },
      onResponseError: ({ response }) => {
        throw parseApiError({ response });
      },
    });
  }

  /**
   * Retrieves the active correlation ID for this client instance.
   */
  public getCorrelationId(): string {
    return this.correlationId;
  }

  /**
   * Generic GET request.
   */
  public async get<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    try {
      return await this.fetcher<T>(path, { ...options, method: 'GET' });
    } catch (error) {
      throw parseApiError(error);
    }
  }

  /**
   * Generic POST request.
   */
  public async post<T>(
    path: string,
    body?: Record<string, any> | BodyInit | null,
    options?: ApiRequestOptions,
  ): Promise<T> {
    try {
      return await this.fetcher<T>(path, { ...options, method: 'POST', body });
    } catch (error) {
      throw parseApiError(error);
    }
  }

  /**
   * Generic PUT request.
   */
  public async put<T>(
    path: string,
    body?: Record<string, any> | BodyInit | null,
    options?: ApiRequestOptions,
  ): Promise<T> {
    try {
      return await this.fetcher<T>(path, { ...options, method: 'PUT', body });
    } catch (error) {
      throw parseApiError(error);
    }
  }

  /**
   * Generic PATCH request.
   */
  public async patch<T>(
    path: string,
    body?: Record<string, any> | BodyInit | null,
    options?: ApiRequestOptions,
  ): Promise<T> {
    try {
      return await this.fetcher<T>(path, { ...options, method: 'PATCH', body });
    } catch (error) {
      throw parseApiError(error);
    }
  }

  /**
   * Generic DELETE request.
   */
  public async delete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    try {
      return await this.fetcher<T>(path, { ...options, method: 'DELETE' });
    } catch (error) {
      throw parseApiError(error);
    }
  }

  // ---------------------------------------------------------------------------
  // Domain API Methods
  // ---------------------------------------------------------------------------

  // Health
  public async getHealth(options?: ApiRequestOptions): Promise<HealthResponse> {
    return this.get<HealthResponse>('/health', options);
  }

  public async getPing(options?: ApiRequestOptions): Promise<string> {
    return this.get<string>('/health/ping', options);
  }

  // Auth / Users
  public async getMe(options?: ApiRequestOptions): Promise<UserDto> {
    return this.get<UserDto>('/auth/me', options);
  }

  public async login(
    credentials: Record<string, unknown>,
    options?: ApiRequestOptions,
  ): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/login', credentials, options);
  }

  public async register(
    payload: RegisterRequest | Record<string, unknown>,
    options?: ApiRequestOptions,
  ): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/register', payload, options);
  }

  public async linkGateway(
    payload: LinkGatewayRequest,
    options?: ApiRequestOptions,
  ): Promise<UserDto> {
    return this.post<UserDto>('/auth/link-gateway', payload, options);
  }

  public async resetPassword(
    payload: ResetPasswordRequest,
    options?: ApiRequestOptions,
  ): Promise<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>(
      '/auth/reset-password',
      payload,
      options,
    );
  }

  // Wallet & Transactions
  public async getWallet(options?: ApiRequestOptions): Promise<WalletDto> {
    return this.get<WalletDto>('/wallet', options);
  }

  public async getTransactions(
    filters?: TransactionFilters,
    options?: ApiRequestOptions,
  ): Promise<TransactionDto[]> {
    return this.get<TransactionDto[]>('/wallet/transactions', {
      ...options,
      query: { ...options?.query, ...filters },
    });
  }

  // Fees
  public async getFees(brand?: string, options?: ApiRequestOptions): Promise<FeeDto[]> {
    const res = await this.get<FeeDto[] | { total?: number; fees?: FeeDto[] }>('/fees', {
      ...options,
      query: { ...options?.query, ...(brand ? { brand } : {}) },
    });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).fees)) return (res as any).fees;
    return [];
  }

  // Payments
  public async createPixPayment(
    data: PixPaymentRequest,
    options?: ApiRequestOptions,
  ): Promise<PixPaymentResponse> {
    return this.post<PixPaymentResponse>('/payments/pix', data, options);
  }

  public async createCardPayment(
    data: CardPaymentRequest,
    options?: ApiRequestOptions,
  ): Promise<CardPaymentResponse> {
    return this.post<CardPaymentResponse>('/payments/card', data, options);
  }

  public async getPayment(
    id: string,
    options?: ApiRequestOptions,
  ): Promise<PixPaymentResponse | CardPaymentResponse> {
    return this.get<PixPaymentResponse | CardPaymentResponse>(`/payments/${id}`, options);
  }

  public async getPublicCheckoutPayment(
    checkoutLinkId: string,
    orderId: string,
    options?: ApiRequestOptions,
  ): Promise<CheckoutPaymentStatusDto> {
    return this.get<CheckoutPaymentStatusDto>(
      `/payments/checkout-links/${checkoutLinkId}/${orderId}`,
      options,
    );
  }

  // Checkout Links
  public async createCheckoutLink(
    data: CheckoutLinkRequest,
    options?: ApiRequestOptions,
  ): Promise<CheckoutLinkDto> {
    return this.post<CheckoutLinkDto>('/checkout-links', data, options);
  }

  public async getCheckoutLinks(options?: ApiRequestOptions): Promise<CheckoutLinkDto[]> {
    return this.get<CheckoutLinkDto[]>('/checkout-links', options);
  }

  public async getCheckoutLink(id: string, options?: ApiRequestOptions): Promise<CheckoutLinkDto> {
    return this.get<CheckoutLinkDto>(`/checkout-links/${id}`, options);
  }

  // Withdrawals
  public async createWithdrawal(
    data: WithdrawalRequest,
    options?: ApiRequestOptions,
  ): Promise<WithdrawalDto> {
    return this.post<WithdrawalDto>('/withdrawals', data, options);
  }

  public async getWithdrawals(options?: ApiRequestOptions): Promise<WithdrawalDto[]> {
    return this.get<WithdrawalDto[]>('/withdrawals', options);
  }

  public async getWithdrawal(id: string, options?: ApiRequestOptions): Promise<WithdrawalDto> {
    return this.get<WithdrawalDto>(`/withdrawals/${id}`, options);
  }

  // Webhooks
  public async listWebhooks(options?: ApiRequestOptions): Promise<WebhookDto[]> {
    return this.get<WebhookDto[]>('/webhooks', options);
  }

  public async upsertWebhook(
    data: UpsertWebhookRequest,
    options?: ApiRequestOptions,
  ): Promise<WebhookDto> {
    return this.post<WebhookDto>('/webhooks', data, options);
  }

  public async deleteWebhook(
    id: string,
    options?: ApiRequestOptions,
  ): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/webhooks/${id}`, options);
  }
}

/**
 * Browser singleton instance of ApiClient with the persisted access token wired in.
 */
export const defaultApiClient = new ApiClient({
  getToken: () => getAccessToken(),
});

/**
 * Creates a server-scoped ApiClient for use inside React Router SSR loaders.
 */
export function createServerApiClient(request?: Request, options?: ApiClientOptions): ApiClient {
  return new ApiClient({
    ...options,
    request,
  });
}
