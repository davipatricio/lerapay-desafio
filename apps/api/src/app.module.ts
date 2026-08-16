import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as mysql from 'mysql2';
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
      useFactory: (config: ConfigService) => {
        const isSsl =
          config.get<string>('DB_SSL') === 'true' ||
          config.get<string>('DB_SSL') === '1' ||
          config.get<string>('DB_SSL_MODE') === 'REQUIRED' ||
          config.get<string>('DB_SSL_MODE') === 'required';

        return {
          autoLoadEntities: true,
          database: config.get<string>('DB_NAME', 'app'),
          // Keep mysql2 statically reachable for serverless bundlers; TypeORM otherwise
          // resolves it through a dynamic require that Vercel cannot trace.
          driver: mysql,
          host: config.get<string>('DB_HOST', 'localhost'),
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          migrationsRun: true,
          password: config.get<string>('DB_PASSWORD', 'app'),
          port: config.get<number>('DB_PORT', 3306),
          ssl: isSsl
            ? {
                rejectUnauthorized: config.get<string>('DB_SSL_REJECT_UNAUTHORIZED') === 'true',
              }
            : undefined,
          synchronize: false,
          type: 'mysql',
          username: config.get<string>('DB_USER', 'app'),
        };
      },
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
