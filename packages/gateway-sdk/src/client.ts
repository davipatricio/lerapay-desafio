import { ofetch, type FetchOptions } from 'ofetch';
import { BranchPayError } from './errors';
import type {
  CreateCardPaymentDto,
  CreateCardPaymentResponse,
  CreatePixPaymentDto,
  CreatePixPaymentResponse,
  CreateUserDto,
  CreateUserResponse,
  CreateWebhookDto,
  CreateWithdrawDto,
  CreateWithdrawResponse,
  DeleteWebhookResponse,
  FeeTableItem,
  GetFeesParams,
  LoginDto,
  LoginResponse,
  PaymentDetailsResponse,
  ResetPasswordDto,
  TransactionItem,
  UserMeResponse,
  WalletResponse,
  WebhookItem,
  WithdrawalDetailsResponse,
} from './types';

export interface BranchPayClientOptions {
  baseUrl?: string;
  token?: string;
  timeout?: number;
}

export class BranchPayClient {
  private readonly baseUrl: string;
  private token?: string;
  private readonly timeout: number;

  constructor(options: BranchPayClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? 'https://api.branchpay.com.br/api').replace(/\/$/, '');
    this.token = options.token;
    this.timeout = options.timeout ?? 10000;
  }

  public setToken(token: string): void {
    this.token = token;
  }

  public getToken(): string | undefined {
    return this.token;
  }

  private async request<T>(
    path: string,
    options: FetchOptions<'json'> = {},
    overrideToken?: string,
  ): Promise<T> {
    const activeToken = overrideToken ?? this.token;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (activeToken) {
      headers.Authorization = `Bearer ${activeToken}`;
    }

    try {
      const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
      return await ofetch<T>(url, {
        ...options,
        headers,
        timeout: this.timeout,
        responseType: 'json',
      });
    } catch (error: any) {
      if (error?.response) {
        throw new BranchPayError(
          error.response._data?.message ?? error.message ?? 'BranchPay API Error',
          error.response.status ?? 500,
          error.response._data,
          error.response._data?.code,
        );
      }
      throw new BranchPayError(error?.message ?? 'Network error', 500);
    }
  }

  // --- Auth / Users (Public) ---
  public async createUser(dto: CreateUserDto): Promise<CreateUserResponse> {
    return this.request<CreateUserResponse>('/users', {
      method: 'POST',
      body: dto,
    });
  }

  public async login(dto: LoginDto): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: dto,
    });
  }

  public async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: dto,
    });
  }

  public async getFees(params?: GetFeesParams): Promise<FeeTableItem[]> {
    const query = params?.brand ? { brand: params.brand } : undefined;
    const res = await this.request<FeeTableItem[] | { total?: number; fees?: FeeTableItem[] }>(
      '/fees',
      {
        method: 'GET',
        query,
      },
    );
    if (Array.isArray(res)) {
      return res;
    }
    if (res && Array.isArray((res as any).fees)) {
      return (res as any).fees;
    }
    return [];
  }

  // --- Protected Endpoints ---
  public async getMe(token?: string): Promise<UserMeResponse> {
    return this.request<UserMeResponse>('/users/me', { method: 'GET' }, token);
  }

  public async getWallet(token?: string): Promise<WalletResponse> {
    return this.request<WalletResponse>('/wallet', { method: 'GET' }, token);
  }

  public async listTransactions(
    params?: { status?: string; type?: string; limit?: number },
    token?: string,
  ): Promise<TransactionItem[]> {
    return this.request<TransactionItem[]>(
      '/wallet/transactions',
      {
        method: 'GET',
        query: params,
      },
      token,
    );
  }

  public async createPixPayment(
    dto: CreatePixPaymentDto,
    token?: string,
  ): Promise<CreatePixPaymentResponse> {
    return this.request<CreatePixPaymentResponse>(
      '/payments/pix',
      {
        method: 'POST',
        body: dto,
      },
      token,
    );
  }

  public async createCardPayment(
    dto: CreateCardPaymentDto,
    token?: string,
  ): Promise<CreateCardPaymentResponse> {
    return this.request<CreateCardPaymentResponse>(
      '/payments/card',
      {
        method: 'POST',
        body: dto,
      },
      token,
    );
  }

  public async getPayment(id: string, token?: string): Promise<PaymentDetailsResponse> {
    return this.request<PaymentDetailsResponse>(`/payments/${id}`, { method: 'GET' }, token);
  }

  public async createWithdrawal(
    dto: CreateWithdrawDto,
    token?: string,
  ): Promise<CreateWithdrawResponse> {
    return this.request<CreateWithdrawResponse>(
      '/withdrawals',
      {
        method: 'POST',
        body: dto,
      },
      token,
    );
  }

  public async getWithdrawal(id: string, token?: string): Promise<WithdrawalDetailsResponse> {
    return this.request<WithdrawalDetailsResponse>(`/withdrawals/${id}`, { method: 'GET' }, token);
  }

  public async upsertWebhook(dto: CreateWebhookDto, token?: string): Promise<WebhookItem> {
    return this.request<WebhookItem>(
      '/webhooks',
      {
        method: 'POST',
        body: dto,
      },
      token,
    );
  }

  public async listWebhooks(token?: string): Promise<WebhookItem[]> {
    return this.request<WebhookItem[]>('/webhooks', { method: 'GET' }, token);
  }

  public async deleteWebhook(id: string, token?: string): Promise<DeleteWebhookResponse> {
    return this.request<DeleteWebhookResponse>(`/webhooks/${id}`, { method: 'DELETE' }, token);
  }
}
