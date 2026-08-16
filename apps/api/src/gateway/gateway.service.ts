import {
  BranchPayClient,
  type CreateCardPaymentDto,
  type CreateCardPaymentResponse,
  type CreatePixPaymentDto,
  type CreatePixPaymentResponse,
  type CreateUserDto,
  type CreateUserResponse,
  type CreateWebhookDto,
  type CreateWithdrawDto,
  type CreateWithdrawResponse,
  type DeleteWebhookResponse,
  type FeeTableItem,
  type GetFeesParams,
  type LoginDto,
  type LoginResponse,
  type PaymentDetailsResponse,
  type ResetPasswordDto,
  type TransactionItem,
  type UserMeResponse,
  type WalletResponse,
  type WebhookItem,
  type WithdrawalDetailsResponse,
  verifyWebhookSignature,
} from '@lerapay/gateway-sdk';
import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_GATEWAY_BASE_URL, DEFAULT_GATEWAY_TIMEOUT } from './gateway.constants';

@Injectable()
export class GatewayService {
  private readonly client: BranchPayClient;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(@Optional() private readonly configService?: ConfigService) {
    this.baseUrl = this.configService?.get<string>('GATEWAY_BASE_URL') ?? DEFAULT_GATEWAY_BASE_URL;

    this.timeout = this.configService?.get<number>('GATEWAY_TIMEOUT') ?? DEFAULT_GATEWAY_TIMEOUT;

    const token = this.configService?.get<string>('GATEWAY_TOKEN');

    this.client = new BranchPayClient({
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      token,
    });
  }

  /**
   * Access the underlying default BranchPayClient instance.
   */
  public getClient(): BranchPayClient {
    return this.client;
  }

  /**
   * Returns a new BranchPayClient instance scoped with the specified user/bearer token.
   */
  public forToken(token: string): BranchPayClient {
    return new BranchPayClient({
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      token,
    });
  }

  /**
   * Helper to verify webhook signatures using HMAC-SHA256.
   */
  public verifyWebhookSignature(
    payload: string | object,
    signature: string,
    secret: string,
  ): Promise<boolean> {
    return verifyWebhookSignature(payload, signature, secret);
  }

  // --- Base client delegation methods ---

  public createUser(dto: CreateUserDto): Promise<CreateUserResponse> {
    return this.client.createUser(dto);
  }

  public login(dto: LoginDto): Promise<LoginResponse> {
    return this.client.login(dto);
  }

  public resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    return this.client.resetPassword(dto);
  }

  public getFees(params?: GetFeesParams): Promise<FeeTableItem[]> {
    return this.client.getFees(params);
  }

  public getMe(token?: string): Promise<UserMeResponse> {
    return this.client.getMe(token);
  }

  public getWallet(token?: string): Promise<WalletResponse> {
    return this.client.getWallet(token);
  }

  public listTransactions(
    params?: { status?: string; type?: string; limit?: number },
    token?: string,
  ): Promise<TransactionItem[]> {
    return this.client.listTransactions(params, token);
  }

  public createPixPayment(
    dto: CreatePixPaymentDto,
    token?: string,
  ): Promise<CreatePixPaymentResponse> {
    return this.client.createPixPayment(dto, token);
  }

  public createCardPayment(
    dto: CreateCardPaymentDto,
    token?: string,
  ): Promise<CreateCardPaymentResponse> {
    return this.client.createCardPayment(dto, token);
  }

  public getPayment(id: string, token?: string): Promise<PaymentDetailsResponse> {
    return this.client.getPayment(id, token);
  }

  public createWithdrawal(dto: CreateWithdrawDto, token?: string): Promise<CreateWithdrawResponse> {
    return this.client.createWithdrawal(dto, token);
  }

  public getWithdrawal(id: string, token?: string): Promise<WithdrawalDetailsResponse> {
    return this.client.getWithdrawal(id, token);
  }

  public upsertWebhook(dto: CreateWebhookDto, token?: string): Promise<WebhookItem> {
    return this.client.upsertWebhook(dto, token);
  }

  public listWebhooks(token?: string): Promise<WebhookItem[]> {
    return this.client.listWebhooks(token);
  }

  public deleteWebhook(id: string, token?: string): Promise<DeleteWebhookResponse> {
    return this.client.deleteWebhook(id, token);
  }
}
