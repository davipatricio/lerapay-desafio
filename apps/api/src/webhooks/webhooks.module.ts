import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutModule } from '../checkout/checkout.module';
import { GatewayModule } from '../gateway/gateway.module';
import { Order } from '../payments/entities/order.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { UsersModule } from '../users/users.module';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEvent, Order, Transaction, Withdrawal]),
    GatewayModule,
    CheckoutModule,
    UsersModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
