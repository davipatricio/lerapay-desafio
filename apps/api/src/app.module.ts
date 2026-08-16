import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CheckoutModule } from './checkout/checkout.module';
import { CorrelationIdMiddleware, HttpLoggerMiddleware, RequestContextModule } from './common';
import { FeesModule } from './fees/fees.module';
import { GatewayModule } from './gateway';
import { HealthModule } from './health';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { validateEnvironment } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        autoLoadEntities: true,
        database: config.get<string>('DB_NAME', 'app'),
        host: config.get<string>('DB_HOST', 'localhost'),
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
        password: config.get<string>('DB_PASSWORD', 'app'),
        port: config.get<number>('DB_PORT', 3306),
        synchronize: false,
        type: 'mysql',
        username: config.get<string>('DB_USER', 'app'),
      }),
    }),
    RequestContextModule,
    GatewayModule,
    HealthModule,
    UsersModule,
    AuthModule,
    FeesModule,
    CheckoutModule,
    PaymentsModule,
    WalletModule,
    WithdrawalsModule,
    WebhooksModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware, HttpLoggerMiddleware).forRoutes('{*path}');
  }
}
