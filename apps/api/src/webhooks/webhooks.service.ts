import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckoutService } from '../checkout/checkout.service';
import { GatewayService } from '../gateway/gateway.service';
import { Order } from '../payments/entities/order.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import type { User } from '../users/entities/user.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import type { CreateWebhookDto } from './dto/create-webhook.dto';
import type { GatewayWebhookDto } from './dto/gateway-webhook.dto';
import { WebhookEvent } from './entities/webhook-event.entity';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookEvent)
    private readonly webhookEventRepository: Repository<WebhookEvent>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepository: Repository<Withdrawal>,
    private readonly gatewayService: GatewayService,
    private readonly checkoutService: CheckoutService,
    private readonly configService: ConfigService,
  ) {}

  public async upsertWebhook(user: User, dto: CreateWebhookDto) {
    return this.gatewayService.withMerchantToken(user, (token) =>
      this.gatewayService.upsertWebhook(dto, token),
    );
  }

  public async listWebhooks(user: User) {
    return this.gatewayService.withMerchantToken(user, (token) =>
      this.gatewayService.listWebhooks(token),
    );
  }

  public async deleteWebhook(id: string, user: User) {
    return this.gatewayService.withMerchantToken(user, (token) =>
      this.gatewayService.deleteWebhook(id, token),
    );
  }

  public async handleIncomingWebhook(
    payload: GatewayWebhookDto,
    signature?: string,
    rawBody?: string,
  ): Promise<{ received: boolean; message?: string }> {
    const eventId = `${payload.event}-${payload.transactionId}-${payload.status}`;

    // A assinatura HMAC usa os bytes originais da requisição e é validada antes
    // de qualquer persistência, para não aceitar um payload reserializado.
    const webhookSecret = this.configService.get<string>('GATEWAY_WEBHOOK_SECRET');
    if (webhookSecret) {
      if (!signature) {
        this.logger.warn(`Assinatura ausente para o evento de webhook ${eventId}`);
        throw new BadRequestException('Assinatura de webhook ausente');
      }
      if (!rawBody) {
        this.logger.warn(`Corpo bruto ausente para o evento de webhook ${eventId}`);
        throw new BadRequestException('Corpo bruto ausente para validação de assinatura');
      }
      const isValid = await this.gatewayService.verifyWebhookSignature(
        rawBody,
        signature,
        webhookSecret,
      );
      if (!isValid) {
        this.logger.warn(`Assinatura inválida recebida para o evento de webhook ${eventId}`);
        throw new BadRequestException('Assinatura de webhook inválida');
      }
    }

    // O eventId persistido impede que retentativas repitam transições de estado.
    const existing = await this.webhookEventRepository.findOne({
      where: { eventId },
    });

    if (existing) {
      this.logger.log(`Evento de webhook ${eventId} já processado (ignorado por idempotência)`);
      return { received: true, message: 'Já processado' };
    }

    // Processa o evento de acordo com a categoria recebida
    try {
      if (payload.event === 'PAYMENT_PIX' || payload.event === 'PAYMENT_CARD') {
        await this.handlePaymentEvent(payload);
      } else if (payload.event === 'WITHDRAWAL') {
        await this.handleWithdrawalEvent(payload);
      }

      // Só registra sucesso após aplicar as alterações, consolidando a idempotência.
      const event = this.webhookEventRepository.create({
        eventType: payload.event,
        eventId,
        signature: signature || null,
        payload: payload as any,
        status: 'PROCESSED',
      });
      await this.webhookEventRepository.save(event);

      return { received: true };
    } catch (err: any) {
      this.logger.error(`Erro ao processar evento de webhook ${eventId}: ${err?.message || err}`);

      const event = this.webhookEventRepository.create({
        eventType: payload.event,
        eventId,
        signature: signature || null,
        payload: payload as any,
        status: 'FAILED',
        error: err?.message || String(err),
      });
      await this.webhookEventRepository.save(event);

      throw err;
    }
  }

  private async handlePaymentEvent(payload: GatewayWebhookDto): Promise<void> {
    // Um pagamento aprovado reconcilia pedido, transação e link nessa ordem.
    const order = await this.orderRepository.findOne({
      where: [
        { gatewayPaymentId: payload.transactionId },
        ...(payload.externalReference ? [{ externalReference: payload.externalReference }] : []),
      ],
      relations: { checkoutLink: true },
    });

    if (!order) {
      this.logger.warn(
        `Nenhum pedido local encontrado para o pagamento de webhook ${payload.transactionId} / ${payload.externalReference}`,
      );
      return;
    }

    order.status = payload.status as any;
    await this.orderRepository.save(order);

    // Atualiza a transação contábil correspondente
    const transaction = await this.transactionRepository.findOne({
      where: [
        { orderId: order.id },
        { gatewayTransactionId: payload.transactionId },
        ...(payload.externalReference ? [{ externalReference: payload.externalReference }] : []),
      ],
    });

    if (transaction) {
      transaction.status = payload.status as any;
      await this.transactionRepository.save(transaction);
    }

    // Se o pagamento foi aprovado e originado de um link de checkout, marca o link como COMPLETED
    if (payload.status === 'APPROVED' && order.checkoutLinkId) {
      await this.checkoutService.updateStatus(order.checkoutLinkId, 'COMPLETED');
    }
  }

  private async handleWithdrawalEvent(payload: GatewayWebhookDto): Promise<void> {
    // Reconcilia o registro local de saque e a transação espelhada
    const withdrawal = await this.withdrawalRepository.findOne({
      where: [{ gatewayWithdrawalId: payload.transactionId }, { id: payload.transactionId }],
    });

    if (!withdrawal) {
      this.logger.warn(`Nenhum saque local encontrado para o webhook ${payload.transactionId}`);
      return;
    }

    const mappedStatus =
      payload.status === 'APPROVED'
        ? 'COMPLETED'
        : payload.status === 'DENIED'
          ? 'FAILED'
          : (payload.status as any);

    withdrawal.status = mappedStatus;
    await this.withdrawalRepository.save(withdrawal);

    // Atualiza a transação correspondente
    const transaction = await this.transactionRepository.findOne({
      where: { gatewayTransactionId: payload.transactionId },
    });

    if (transaction) {
      transaction.status = payload.status === 'APPROVED' ? 'APPROVED' : 'DENIED';
      await this.transactionRepository.save(transaction);
    }
  }
}
