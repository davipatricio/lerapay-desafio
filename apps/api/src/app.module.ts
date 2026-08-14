import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

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
  ],
})
export class AppModule {}
