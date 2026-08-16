import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreatePixPaymentDto {
  @ApiProperty({ example: 5000, description: 'Valor em centavos (ex.: 5000 = R$ 50,00)' })
  @IsInt()
  @IsPositive()
  @Min(100)
  amount: number;

  @ApiProperty({ example: '12345678909', description: 'CPF ou CNPJ do pagador' })
  @IsString()
  @IsNotEmpty()
  payerDocument: string;

  @ApiPropertyOptional({
    example: 'Pagamento de Pedido #1234',
    description: 'Descrição do pagamento',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description:
      'ID do link de checkout. Quando informado, o servidor valida o status ativo, expiração, método permitido, valor fixo e referência de conciliação.',
  })
  @IsOptional()
  @IsString()
  checkoutLinkId?: string;

  @ApiPropertyOptional({
    example: 'ORD-2026-9988',
    description: 'Referência externa para conciliação',
  })
  @IsOptional()
  @IsString()
  externalReference?: string;
}
