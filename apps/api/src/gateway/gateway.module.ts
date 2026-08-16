import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewayAccount } from '../auth/entities/gateway-account.entity';
import { GatewayService } from './gateway.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([GatewayAccount])],
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule {}
