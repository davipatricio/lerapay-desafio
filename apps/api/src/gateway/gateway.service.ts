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
import { Injectable, Optional, BadGatewayException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GatewayAccount } from '../auth/entities/gateway-account.entity';
import type { User } from '../users/entities/user.entity';
import {
  GATEWAY_REAUTH_MESSAGE,
  GATEWAY_REAUTH_REQUIRED,
  isGatewayTokenRejection,
} from './gateway-auth.error';
import { DEFAULT_GATEWAY_BASE_URL, DEFAULT_GATEWAY_TIMEOUT } from './gateway.constants';

@Injectable()
export class GatewayService {
  private readonly client: BranchPayClient;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(
    @InjectRepository(GatewayAccount)
    private readonly gatewayAccountRepository: Repository<GatewayAccount>,
    @Optional() private readonly configService?: ConfigService,
  ) {
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
   * Cliente padrão do gateway, usado apenas em rotas públicas do Lera Box.
   */
  public getClient(): BranchPayClient {
    return this.client;
  }

  /**
   * Cria um cliente isolado para o token de um lojista específico, garantindo
   * que uma requisição nunca reutilize a credencial de outro lojista.
   */
  public forToken(token: string): BranchPayClient {
    return new BranchPayClient({
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      token,
    });
  }

  /**
   * Confere a assinatura HMAC-SHA256 de um webhook usando o utilitário do SDK.
   */
  public verifyWebhookSignature(
    payload: string | object,
    signature: string,
    secret: string,
  ): Promise<boolean> {
    return verifyWebhookSignature(payload, signature, secret);
  }

  public withMerchantToken<T>(user: User, operation: (token: string) => Promise<T>): Promise<T> {
    return this.withMerchantTokenByUserId(user.id, operation);
  }

  public async withMerchantTokenByUserId<T>(
    userId: string,
    operation: (token: string) => Promise<T>,
  ): Promise<T> {
    const account = await this.gatewayAccountRepository.findOne({ where: { userId } });
    if (!account?.isLinked || !account.merchantToken) {
      throw new BadRequestException({
        error: {
          code: 'GATEWAY_LINK_REQUIRED',
          message: 'A conta do gateway Lera Box não está vinculada.',
        },
        message: 'A conta do gateway Lera Box não está vinculada.',
      });
    }

    if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() <= Date.now()) {
      await this.invalidateMerchantToken(userId);
      throw new BadGatewayException({
        error: { code: GATEWAY_REAUTH_REQUIRED, message: GATEWAY_REAUTH_MESSAGE },
        message: GATEWAY_REAUTH_MESSAGE,
      });
    }

    try {
      return await operation(account.merchantToken);
    } catch (error) {
      if (!isGatewayTokenRejection(error)) {
        throw error;
      }

      await this.invalidateMerchantToken(userId);
      throw new BadGatewayException({
        error: { code: GATEWAY_REAUTH_REQUIRED, message: GATEWAY_REAUTH_MESSAGE },
        message: GATEWAY_REAUTH_MESSAGE,
      });
    }
  }

  private async invalidateMerchantToken(userId: string): Promise<void> {
    await this.gatewayAccountRepository.update(
      { userId },
      { isLinked: false, merchantToken: null, tokenExpiresAt: null },
    );
  }

  // --- Delegações diretas ao cliente do gateway ---

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
