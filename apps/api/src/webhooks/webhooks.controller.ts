import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { GatewayWebhookDto } from './dto/gateway-webhook.dto';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Register or update a webhook subscription directly on Lera Box Gateway',
  })
  @ApiResponse({ status: 201, description: 'Webhook registered' })
  public async upsertWebhook(@CurrentUser() user: User, @Body() dto: CreateWebhookDto) {
    return this.webhooksService.upsertWebhook(user, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all webhooks registered on Lera Box Gateway for this merchant' })
  @ApiResponse({ status: 200, description: 'List of webhooks' })
  public async listWebhooks(@CurrentUser() user: User) {
    return this.webhooksService.listWebhooks(user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a webhook subscription on Lera Box Gateway' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  public async deleteWebhook(@CurrentUser() user: User, @Param('id') id: string) {
    return this.webhooksService.deleteWebhook(id, user);
  }

  @Post('gateway')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Inbound receiver for asynchronous webhook events emitted by Lera Box Gateway (Pix, Card, Withdrawal)',
  })
  @ApiHeader({
    name: 'x-lera-box-signature',
    required: false,
    description: 'HMAC SHA-256 signature generated with the webhook secret',
  })
  @ApiResponse({ status: 200, description: 'Webhook event processed and acknowledged' })
  public async handleGatewayWebhook(
    @Body() payload: GatewayWebhookDto,
    @Headers('x-lera-box-signature') signature?: string,
  ) {
    return this.webhooksService.handleIncomingWebhook(payload, signature);
  }
}
