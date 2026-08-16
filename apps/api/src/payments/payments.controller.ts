import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CreateCardPaymentDto } from './dto/create-card-payment.dto';
import { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('pix')
  @ApiOperation({
    summary:
      'Initiate a Pix payment directly or for a checkout link, delegating to Lera Box Gateway',
  })
  @ApiResponse({ status: 201, description: 'Pix payment created with QR code and EMV payload' })
  public async createPix(@Body() dto: CreatePixPaymentDto, @Req() req: Request) {
    const user = req.user;
    return this.paymentsService.createPixPayment(
      dto,
      user?.id,
      user?.gatewayAccount?.merchantToken || undefined,
    );
  }

  @Post('card')
  @ApiOperation({
    summary:
      'Process a credit card payment validating fee against gateway fee table and delegating to Lera Box Gateway',
  })
  @ApiResponse({ status: 201, description: 'Card payment processed' })
  public async createCard(@Body() dto: CreateCardPaymentDto, @Req() req: Request) {
    const user = req.user;
    return this.paymentsService.createCardPayment(
      dto,
      user?.id,
      user?.gatewayAccount?.merchantToken || undefined,
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retrieve payment and order status by local ID, Gateway ID, or external reference',
  })
  @ApiResponse({ status: 200, description: 'Payment details' })
  public async getPayment(@Param('id') id: string, @Req() req: Request) {
    const user = req.user;
    return this.paymentsService.getPayment(id, user?.gatewayAccount?.merchantToken || undefined);
  }
}
