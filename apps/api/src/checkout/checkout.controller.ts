import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutLinkDto } from './dto/create-checkout-link.dto';
import { CheckoutLink } from './entities/checkout-link.entity';

@ApiTags('checkout-links')
@Controller('checkout-links')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new checkout link for Pix/Credit Card payments' })
  @ApiResponse({
    status: 201,
    description: 'Checkout link created successfully',
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
  @ApiOperation({ summary: 'List all checkout links created by authenticated merchant' })
  @ApiResponse({ status: 200, description: 'List of checkout links', type: [CheckoutLink] })
  public async findAll(@CurrentUser('id') userId: string): Promise<CheckoutLink[]> {
    return this.checkoutService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get checkout link details by ID (Public for payers)' })
  @ApiResponse({ status: 200, description: 'Checkout link details', type: CheckoutLink })
  public async findOne(@Param('id') id: string): Promise<CheckoutLink> {
    return this.checkoutService.findById(id);
  }
}
