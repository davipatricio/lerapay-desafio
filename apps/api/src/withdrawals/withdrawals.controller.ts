import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { Withdrawal } from './entities/withdrawal.entity';
import { WithdrawalsService } from './withdrawals.service';

@ApiTags('saques')
@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @ApiOperation({
    summary: 'Solicita um saque / transferência para chave Pix via gateway Lera Box',
  })
  @ApiResponse({ status: 201, description: 'Saque solicitado com sucesso', type: Withdrawal })
  public async create(
    @CurrentUser() user: User,
    @Body() dto: CreateWithdrawalDto,
  ): Promise<Withdrawal> {
    return this.withdrawalsService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os saques do lojista autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de saques cadastrados', type: [Withdrawal] })
  public async findAll(@CurrentUser('id') userId: string): Promise<Withdrawal[]> {
    return this.withdrawalsService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulta os detalhes e o status atualizado do saque por ID',
  })
  @ApiResponse({ status: 200, description: 'Detalhes do saque', type: Withdrawal })
  public async findOne(@CurrentUser() user: User, @Param('id') id: string): Promise<Withdrawal> {
    return this.withdrawalsService.findById(id, user);
  }
}
