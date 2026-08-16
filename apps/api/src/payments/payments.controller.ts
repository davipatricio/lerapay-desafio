import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCardPaymentDto } from './dto/create-card-payment.dto';
import { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('pix')
  @ApiOperation({ summary: 'Initiate a public Pix payment for a checkout link' })
  @ApiResponse({ status: 201, description: 'Pix payment created with QR code and EMV payload' })
  public async createPix(@Body() dto: CreatePixPaymentDto) {
    return this.paymentsService.createPixPayment(dto);
  }

  @Post('merchant/pix')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate a direct Pix payment for the authenticated merchant' })
  @ApiResponse({ status: 201, description: 'Pix payment created with QR code and EMV payload' })
  public async createMerchantPix(
    @Body() dto: CreatePixPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createPixPayment(dto, userId);
  }

  @Post('card')
  @ApiOperation({ summary: 'Process a public card payment for a checkout link' })
  @ApiResponse({ status: 201, description: 'Card payment processed' })
  public async createCard(@Body() dto: CreateCardPaymentDto) {
    return this.paymentsService.createCardPayment(dto);
  }

  @Post('merchant/card')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process a direct card payment for the authenticated merchant' })
  @ApiResponse({ status: 201, description: 'Card payment processed' })
  public async createMerchantCard(
    @Body() dto: CreateCardPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createCardPayment(dto, userId);
  }

  @Get('checkout-links/:checkoutLinkId/:orderId')
  @ApiOperation({ summary: 'Retrieve the minimal public status for a checkout payment' })
  @ApiResponse({ status: 200, description: 'Checkout payment status' })
  public async getPublicCheckoutPayment(
    @Param('checkoutLinkId') checkoutLinkId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.getPublicCheckoutPayment(checkoutLinkId, orderId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve a payment owned by the authenticated merchant' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  public async getPayment(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.getMerchantPayment(id, userId);
  }
}
