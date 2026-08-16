import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CorrelationIdMiddleware, HttpLoggerMiddleware, RequestContextModule } from './common';
import { GatewayModule } from './gateway';
import { HealthModule } from './health';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        autoLoadEntities: true,
        database: config.get<string>('DB_NAME', 'app'),
        entities: [],
        host: config.get<string>('DB_HOST', 'localhost'),
        password: config.get<string>('DB_PASSWORD', 'app'),
        port: config.get<number>('DB_PORT', 3306),
        synchronize: config.get('NODE_ENV') !== 'production',
        type: 'mysql',
        username: config.get<string>('DB_USER', 'app'),
      }),
    }),
    RequestContextModule,
    GatewayModule,
    HealthModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware, HttpLoggerMiddleware).forRoutes('*');
  }
}
