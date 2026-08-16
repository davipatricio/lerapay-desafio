import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { TransactionItem, WalletResponse } from '@lerapay/gateway-sdk';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { WalletService } from './wallet.service';

@ApiTags('carteira')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({
    summary:
      'Consulta o saldo em tempo real da carteira e o resumo de transações no gateway Lera Box',
  })
  @ApiResponse({ status: 200, description: 'Saldo da carteira e resumo financeiro' })
  public async getWallet(@CurrentUser() user: User): Promise<WalletResponse> {
    return this.walletService.getWallet(user);
  }

  @Get('transactions')
  @ApiOperation({
    summary:
      'Lista transações em tempo real da carteira com filtros por status e tipo diretamente no gateway Lera Box',
  })
  @ApiResponse({ status: 200, description: 'Lista de transações da carteira' })
  public async listTransactions(
    @CurrentUser() user: User,
    @Query() filters: TransactionQueryDto,
  ): Promise<TransactionItem[]> {
    return this.walletService.listTransactions(user, filters);
  }
}
