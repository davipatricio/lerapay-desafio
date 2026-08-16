import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCheckoutLinkDto {
  @ApiProperty({
    example: 'Produto Premium',
    description: 'Título ou descrição do link de checkout',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 10000, description: 'Valor em centavos (ex.: 10000 = R$ 100,00)' })
  @IsInt()
  @IsPositive()
  @Min(100)
  amount: number;

  @ApiPropertyOptional({
    example: ['PIX', 'CREDIT_CARD'],
    enum: ['PIX', 'CREDIT_CARD'],
    isArray: true,
    description: 'Métodos de pagamento permitidos',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(['PIX', 'CREDIT_CARD'], { each: true })
  allowedMethods?: ('PIX' | 'CREDIT_CARD')[];

  @ApiPropertyOptional({
    example: 12,
    description: 'Número máximo de parcelas no cartão de crédito (1-21)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(21)
  maxInstallments?: number;

  @ApiPropertyOptional({
    example: 'CHK-LOJA-12345',
    description: 'Referência externa personalizada para conciliação',
  })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Data e hora limite de expiração do link',
  })
  @IsOptional()
  expiresAt?: string | Date;
}
