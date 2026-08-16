import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCardPaymentDto {
  @ApiProperty({ example: 15000, description: 'Amount in centavos (e.g. 15000 = R$ 150,00)' })
  @IsInt()
  @IsPositive()
  @Min(100)
  amount: number;

  @ApiProperty({ example: '4111111111111111', description: 'Credit card number' })
  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @ApiProperty({ example: 'JOAO DA SILVA', description: 'Cardholder name' })
  @IsString()
  @IsNotEmpty()
  cardHolder: string;

  @ApiProperty({ example: '12', description: 'Expiration month (MM)' })
  @IsString()
  @IsNotEmpty()
  expiryMonth: string;

  @ApiProperty({ example: '2028', description: 'Expiration year (YYYY)' })
  @IsString()
  @IsNotEmpty()
  expiryYear: string;

  @ApiProperty({ example: '123', description: 'Card CVV' })
  @IsString()
  @IsNotEmpty()
  cvv: string;

  @ApiProperty({ example: 'VISA', enum: ['VISA', 'MASTERCARD', 'ELO'], description: 'Card brand' })
  @IsEnum(['VISA', 'MASTERCARD', 'ELO'])
  brand: 'VISA' | 'MASTERCARD' | 'ELO';

  @ApiProperty({ example: 3, description: 'Number of installments (1-21)' })
  @IsInt()
  @Min(1)
  @Max(21)
  installments: number;

  @ApiProperty({
    example: 5.49,
    description: 'Exact percentage fee corresponding to brand and installments per fee table',
  })
  @IsNumber()
  feePercent: number;

  @ApiPropertyOptional({ example: 'Pagamento de Pedido #1234', description: 'Payment description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description:
      'Checkout Link ID. When provided, the server enforces its active status, expiration, allowed method, fixed amount, installment limit, and reconciliation reference.',
  })
  @IsOptional()
  @IsString()
  checkoutLinkId?: string;

  @ApiPropertyOptional({
    example: 'ORD-2026-9988',
    description: 'External reference for reconciliation',
  })
  @IsOptional()
  @IsString()
  externalReference?: string;
}
