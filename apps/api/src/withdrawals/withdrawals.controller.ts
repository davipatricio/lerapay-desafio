import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { Withdrawal } from './entities/withdrawal.entity';
import { WithdrawalsService } from './withdrawals.service';

@ApiTags('withdrawals')
@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @ApiOperation({
    summary: 'Request a withdrawal / payout to a Pix key via Lera Box Gateway',
  })
  @ApiResponse({ status: 201, description: 'Withdrawal created', type: Withdrawal })
  public async create(
    @CurrentUser() user: User,
    @Body() dto: CreateWithdrawalDto,
  ): Promise<Withdrawal> {
    return this.withdrawalsService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all withdrawals for authenticated merchant' })
  @ApiResponse({ status: 200, description: 'List of withdrawals', type: [Withdrawal] })
  public async findAll(@CurrentUser('id') userId: string): Promise<Withdrawal[]> {
    return this.withdrawalsService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve withdrawal status by ID from local database and Lera Box Gateway',
  })
  @ApiResponse({ status: 200, description: 'Withdrawal details', type: Withdrawal })
  public async findOne(@CurrentUser() user: User, @Param('id') id: string): Promise<Withdrawal> {
    return this.withdrawalsService.findById(id, user);
  }
}
