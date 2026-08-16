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
    description: 'Title or description of the checkout link',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 10000, description: 'Amount in centavos (e.g. 10000 = R$ 100,00)' })
  @IsInt()
  @IsPositive()
  @Min(100)
  amount: number;

  @ApiPropertyOptional({
    example: ['PIX', 'CREDIT_CARD'],
    enum: ['PIX', 'CREDIT_CARD'],
    isArray: true,
    description: 'Allowed payment methods',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(['PIX', 'CREDIT_CARD'], { each: true })
  allowedMethods?: ('PIX' | 'CREDIT_CARD')[];

  @ApiPropertyOptional({ example: 12, description: 'Maximum installments for credit card (1-21)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(21)
  maxInstallments?: number;

  @ApiPropertyOptional({ example: 'CHK-LOJA-12345', description: 'Custom external reference' })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z', description: 'Expiration date' })
  @IsOptional()
  expiresAt?: string | Date;
}
