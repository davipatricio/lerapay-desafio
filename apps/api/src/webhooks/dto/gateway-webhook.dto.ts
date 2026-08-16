import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GatewayWebhookDto {
  @ApiProperty({
    enum: ['PAYMENT_PIX', 'PAYMENT_CARD', 'WITHDRAWAL'],
    description: 'Event type sent by gateway',
  })
  @IsEnum(['PAYMENT_PIX', 'PAYMENT_CARD', 'WITHDRAWAL'])
  event: 'PAYMENT_PIX' | 'PAYMENT_CARD' | 'WITHDRAWAL';

  @ApiProperty({
    enum: ['APPROVED', 'DENIED', 'CANCELLED', 'EXPIRED', 'PENDING'],
    description: 'Final or transitional transaction status',
  })
  @IsEnum(['APPROVED', 'DENIED', 'CANCELLED', 'EXPIRED', 'PENDING'])
  status: 'APPROVED' | 'DENIED' | 'CANCELLED' | 'EXPIRED' | 'PENDING';

  @ApiProperty({ example: 'tx_1234567890', description: 'Gateway transaction identifier' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiPropertyOptional({ example: 'ORD-1234', description: 'Original external reference' })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiPropertyOptional({ example: 10000, description: 'Amount in centavos' })
  @IsOptional()
  @IsInt()
  amount?: number;

  @ApiPropertyOptional({ example: '2026-08-16T12:00:00.000Z', description: 'Event timestamp' })
  @IsOptional()
  @IsString()
  timestamp?: string;
}
