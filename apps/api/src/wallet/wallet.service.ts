import { Injectable } from '@nestjs/common';
import type { TransactionItem, WalletResponse } from '@lerapay/gateway-sdk';
import { GatewayService } from '../gateway/gateway.service';
import type { User } from '../users/entities/user.entity';
import type { TransactionQueryDto } from './dto/transaction-query.dto';

@Injectable()
export class WalletService {
  constructor(private readonly gatewayService: GatewayService) {}

  public async getWallet(user: User): Promise<WalletResponse> {
    return this.gatewayService.withMerchantToken(user, (token) => this.gatewayService.getWallet(token));
  }

  public async listTransactions(
    user: User,
    filters?: TransactionQueryDto,
  ): Promise<TransactionItem[]> {
    return this.gatewayService.withMerchantToken(user, (token) =>
      this.gatewayService.listTransactions(filters, token),
    );
  }
}
