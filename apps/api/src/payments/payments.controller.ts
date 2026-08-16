import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCardPaymentDto } from './dto/create-card-payment.dto';
import { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('pagamentos')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('pix')
  @ApiOperation({ summary: 'Inicia um pagamento Pix público para um link de checkout' })
  @ApiResponse({
    status: 201,
    description: 'Pagamento Pix criado com QR code e código copia-e-cola (EMV)',
  })
  public async createPix(@Body() dto: CreatePixPaymentDto) {
    return this.paymentsService.createPixPayment(dto);
  }

  @Post('merchant/pix')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inicia um pagamento Pix direto para o lojista autenticado' })
  @ApiResponse({
    status: 201,
    description: 'Pagamento Pix criado com QR code e código copia-e-cola (EMV)',
  })
  public async createMerchantPix(
    @Body() dto: CreatePixPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createPixPayment(dto, userId);
  }

  @Post('card')
  @ApiOperation({ summary: 'Processa um pagamento público via cartão para um link de checkout' })
  @ApiResponse({ status: 201, description: 'Pagamento com cartão processado com sucesso' })
  public async createCard(@Body() dto: CreateCardPaymentDto) {
    return this.paymentsService.createCardPayment(dto);
  }

  @Post('merchant/card')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Processa um pagamento direto via cartão para o lojista autenticado' })
  @ApiResponse({ status: 201, description: 'Pagamento com cartão processado com sucesso' })
  public async createMerchantCard(
    @Body() dto: CreateCardPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createCardPayment(dto, userId);
  }

  @Get('checkout-links/:checkoutLinkId/:orderId')
  @ApiOperation({ summary: 'Consulta o status público simplificado de um pagamento de checkout' })
  @ApiResponse({ status: 200, description: 'Status do pagamento do checkout' })
  public async getPublicCheckoutPayment(
    @Param('checkoutLinkId') checkoutLinkId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.getPublicCheckoutPayment(checkoutLinkId, orderId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consulta um pagamento pertencente ao lojista autenticado' })
  @ApiResponse({ status: 200, description: 'Detalhes do pagamento' })
  public async getPayment(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.getMerchantPayment(id, userId);
  }
}
