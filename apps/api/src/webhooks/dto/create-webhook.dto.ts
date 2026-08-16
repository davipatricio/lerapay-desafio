import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({
    enum: ['PAYMENT_PIX', 'PAYMENT_CARD', 'WITHDRAWAL'],
    description: 'Event type to listen for',
  })
  @IsEnum(['PAYMENT_PIX', 'PAYMENT_CARD', 'WITHDRAWAL'])
  event: 'PAYMENT_PIX' | 'PAYMENT_CARD' | 'WITHDRAWAL';

  @ApiProperty({
    example: 'https://meudominio.com.br/api/webhooks/gateway',
    description: 'Callback destination URL',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({
    example: 'segredo-hmac-123',
    description: 'Optional secret for HMAC SHA-256 signature verification',
  })
  @IsOptional()
  @IsString()
  secret?: string;
}
