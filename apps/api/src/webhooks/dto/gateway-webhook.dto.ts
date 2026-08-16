import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GatewayWebhookDto {
  @ApiProperty({
    enum: ['PAYMENT_PIX', 'PAYMENT_CARD', 'WITHDRAWAL'],
    description: 'Tipo de evento enviado pelo gateway',
  })
  @IsEnum(['PAYMENT_PIX', 'PAYMENT_CARD', 'WITHDRAWAL'])
  event: 'PAYMENT_PIX' | 'PAYMENT_CARD' | 'WITHDRAWAL';

  @ApiProperty({
    enum: ['APPROVED', 'DENIED', 'CANCELLED', 'EXPIRED', 'PENDING'],
    description: 'Status final ou transicional da transação',
  })
  @IsEnum(['APPROVED', 'DENIED', 'CANCELLED', 'EXPIRED', 'PENDING'])
  status: 'APPROVED' | 'DENIED' | 'CANCELLED' | 'EXPIRED' | 'PENDING';

  @ApiProperty({
    example: 'tx_1234567890',
    description: 'Identificador da transação no gateway',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiPropertyOptional({
    example: 'ORD-1234',
    description: 'Referência externa original do pedido ou transação',
  })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiPropertyOptional({ example: 10000, description: 'Valor da transação em centavos' })
  @IsOptional()
  @IsInt()
  amount?: number;

  @ApiPropertyOptional({
    example: '2026-08-16T12:00:00.000Z',
    description: 'Data e hora de ocorrência do evento',
  })
  @IsOptional()
  @IsString()
  timestamp?: string;
}
