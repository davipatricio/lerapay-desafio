import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreatePixPaymentDto {
  @ApiProperty({ example: 5000, description: 'Amount in centavos (e.g. 5000 = R$ 50,00)' })
  @IsInt()
  @IsPositive()
  @Min(100)
  amount: number;

  @ApiProperty({ example: '12345678909', description: 'CPF/CNPJ of the payer' })
  @IsString()
  @IsNotEmpty()
  payerDocument: string;

  @ApiPropertyOptional({ example: 'Pagamento de Pedido #1234', description: 'Payment description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description:
      'Checkout Link ID. When provided, the server enforces its active status, expiration, allowed method, fixed amount, and reconciliation reference.',
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
