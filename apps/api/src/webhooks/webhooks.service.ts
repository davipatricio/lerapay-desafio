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
    const token = user.gatewayAccount?.merchantToken;
    if (!token) {
      throw new BadRequestException(
        'Lera Box Gateway account is not linked. Please link your gateway credentials before managing webhooks.',
      );
    }

    return this.gatewayService.upsertWebhook(dto, token);
  }

  public async listWebhooks(user: User) {
    const token = user.gatewayAccount?.merchantToken;
    if (!token) {
      throw new BadRequestException(
        'Lera Box Gateway account is not linked. Please link your gateway credentials before managing webhooks.',
      );
    }

    return this.gatewayService.listWebhooks(token);
  }

  public async deleteWebhook(id: string, user: User) {
    const token = user.gatewayAccount?.merchantToken;
    if (!token) {
      throw new BadRequestException(
        'Lera Box Gateway account is not linked. Please link your gateway credentials before managing webhooks.',
      );
    }

    return this.gatewayService.deleteWebhook(id, token);
  }

  public async handleIncomingWebhook(
    payload: GatewayWebhookDto,
    signature?: string,
    rawBody?: string,
  ): Promise<{ received: boolean; message?: string }> {
    const eventId = `${payload.event}-${payload.transactionId}-${payload.status}`;

    // Verify HMAC SHA-256 signature if secret is configured
    const webhookSecret = this.configService.get<string>('GATEWAY_WEBHOOK_SECRET');
    if (webhookSecret) {
      if (!signature) {
        this.logger.warn(`Missing signature for webhook event ${eventId}`);
        throw new BadRequestException('Missing webhook signature');
      }
      if (!rawBody) {
        this.logger.warn(`Missing raw body for webhook event ${eventId}`);
        throw new BadRequestException('Missing raw body for signature verification');
      }
      const isValid = await this.gatewayService.verifyWebhookSignature(
        rawBody,
        signature,
        webhookSecret,
      );
      if (!isValid) {
        this.logger.warn(`Invalid signature received for webhook event ${eventId}`);
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    // Idempotency check: avoid duplicate processing
    const existing = await this.webhookEventRepository.findOne({
      where: { eventId },
    });

    if (existing) {
      this.logger.log(`Webhook event ${eventId} already processed (idempotent skip)`);
      return { received: true, message: 'Already processed' };
    }

    // Process event based on event type
    try {
      if (payload.event === 'PAYMENT_PIX' || payload.event === 'PAYMENT_CARD') {
        await this.handlePaymentEvent(payload);
      } else if (payload.event === 'WITHDRAWAL') {
        await this.handleWithdrawalEvent(payload);
      }

      // Record successfully processed event
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
      this.logger.error(`Error processing webhook event ${eventId}: ${err?.message || err}`);

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
    const order = await this.orderRepository.findOne({
      where: [
        { gatewayPaymentId: payload.transactionId },
        ...(payload.externalReference ? [{ externalReference: payload.externalReference }] : []),
      ],
      relations: { checkoutLink: true },
    });

    if (!order) {
      this.logger.warn(
        `No local order matched webhook payment ${payload.transactionId} / ${payload.externalReference}`,
      );
      return;
    }

    order.status = payload.status as any;
    await this.orderRepository.save(order);

    // Update Transaction
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

    // If payment approved and attached to a checkout link, mark checkout link as COMPLETED
    if (payload.status === 'APPROVED' && order.checkoutLinkId) {
      await this.checkoutService.updateStatus(order.checkoutLinkId, 'COMPLETED');
    }
  }

  private async handleWithdrawalEvent(payload: GatewayWebhookDto): Promise<void> {
    const withdrawal = await this.withdrawalRepository.findOne({
      where: [{ gatewayWithdrawalId: payload.transactionId }, { id: payload.transactionId }],
    });

    if (!withdrawal) {
      this.logger.warn(`No local withdrawal matched webhook ${payload.transactionId}`);
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

    // Update Transaction
    const transaction = await this.transactionRepository.findOne({
      where: { gatewayTransactionId: payload.transactionId },
    });

    if (transaction) {
      transaction.status = payload.status === 'APPROVED' ? 'APPROVED' : 'DENIED';
      await this.transactionRepository.save(transaction);
    }
  }
}
