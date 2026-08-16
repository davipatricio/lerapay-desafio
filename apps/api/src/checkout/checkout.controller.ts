import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutLinkDto } from './dto/create-checkout-link.dto';
import { CheckoutLink } from './entities/checkout-link.entity';

@ApiTags('links-de-checkout')
@Controller('checkout-links')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cria um novo link de checkout para pagamentos via Pix ou Cartão de Crédito',
  })
  @ApiResponse({
    status: 201,
    description: 'Link de checkout criado com sucesso',
    type: CheckoutLink,
  })
  public async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCheckoutLinkDto,
  ): Promise<CheckoutLink> {
    return this.checkoutService.create(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todos os links de checkout criados pelo lojista autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de links de checkout', type: [CheckoutLink] })
  public async findAll(@CurrentUser('id') userId: string): Promise<CheckoutLink[]> {
    return this.checkoutService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém detalhes do link de checkout por ID (Público para pagadores)' })
  @ApiResponse({ status: 200, description: 'Detalhes do link de checkout', type: CheckoutLink })
  public async findOne(@Param('id') id: string): Promise<CheckoutLink> {
    return this.checkoutService.findById(id);
  }
}
