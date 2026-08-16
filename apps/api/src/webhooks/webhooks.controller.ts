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
  Req,
  UseGuards,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
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
    summary: 'Cadastra ou atualiza uma subscrição de webhook diretamente no gateway Lera Box',
  })
  @ApiResponse({ status: 201, description: 'Webhook cadastrado com sucesso' })
  public async upsertWebhook(@CurrentUser() user: User, @Body() dto: CreateWebhookDto) {
    return this.webhooksService.upsertWebhook(user, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista todos os webhooks cadastrados no gateway Lera Box para este lojista',
  })
  @ApiResponse({ status: 200, description: 'Lista de webhooks cadastrados' })
  public async listWebhooks(@CurrentUser() user: User) {
    return this.webhooksService.listWebhooks(user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove uma subscrição de webhook no gateway Lera Box' })
  @ApiResponse({ status: 200, description: 'Webhook removido com sucesso' })
  public async deleteWebhook(@CurrentUser() user: User, @Param('id') id: string) {
    return this.webhooksService.deleteWebhook(id, user);
  }

  @Post('gateway')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Receptor de eventos assíncronos de webhook emitidos pelo gateway Lera Box (Pix, Cartão, Saque)',
  })
  @ApiHeader({
    name: 'x-lera-box-signature',
    required: false,
    description:
      'Assinatura HMAC SHA-256 gerada com o segredo do webhook (obrigatória quando GATEWAY_WEBHOOK_SECRET estiver configurado)',
  })
  @ApiResponse({ status: 200, description: 'Evento de webhook processado e confirmado' })
  @ApiResponse({
    status: 400,
    description: 'Assinatura inválida/ausente ou carga útil malformatada',
  })
  public async handleGatewayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: GatewayWebhookDto,
    @Headers('x-lera-box-signature') signature?: string,
  ) {
    const rawBody = req.rawBody?.toString('utf-8');
    return this.webhooksService.handleIncomingWebhook(payload, signature, rawBody);
  }
}
