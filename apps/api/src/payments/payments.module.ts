import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutModule } from '../checkout/checkout.module';
import { FeesModule } from '../fees/fees.module';
import { GatewayModule } from '../gateway/gateway.module';
import { UsersModule } from '../users/users.module';
import { Order } from './entities/order.entity';
import { Transaction } from './entities/transaction.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Transaction]),
    GatewayModule,
    FeesModule,
    CheckoutModule,
    UsersModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
