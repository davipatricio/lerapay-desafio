import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { TransactionItem, WalletResponse } from '@lerapay/gateway-sdk';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve live wallet balance and transaction summary from Lera Box Gateway',
  })
  @ApiResponse({ status: 200, description: 'Wallet balance and summary' })
  public async getWallet(@CurrentUser() user: User): Promise<WalletResponse> {
    return this.walletService.getWallet(user);
  }

  @Get('transactions')
  @ApiOperation({
    summary:
      'List live wallet transactions with status and type filters directly from Lera Box Gateway',
  })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  public async listTransactions(
    @CurrentUser() user: User,
    @Query() filters: TransactionQueryDto,
  ): Promise<TransactionItem[]> {
    return this.walletService.listTransactions(user, filters);
  }
}
