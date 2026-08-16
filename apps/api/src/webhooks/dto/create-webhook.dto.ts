import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({
    enum: ['PAYMENT_PIX', 'PAYMENT_CARD', 'WITHDRAWAL'],
    description: 'Tipo de evento a ser monitorado',
  })
  @IsEnum(['PAYMENT_PIX', 'PAYMENT_CARD', 'WITHDRAWAL'])
  event: 'PAYMENT_PIX' | 'PAYMENT_CARD' | 'WITHDRAWAL';

  @ApiProperty({
    example: 'https://meudominio.com.br/api/webhooks/gateway',
    description: 'URL de destino para o callback',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({
    example: 'segredo-hmac-123',
    description: 'Segredo opcional para verificação de assinatura HMAC SHA-256',
  })
  @IsOptional()
  @IsString()
  secret?: string;
}
