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
  @ApiProperty({ example: 15000, description: 'Valor em centavos (ex.: 15000 = R$ 150,00)' })
  @IsInt()
  @IsPositive()
  @Min(100)
  amount: number;

  @ApiProperty({ example: '4111111111111111', description: 'Número do cartão de crédito' })
  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @ApiProperty({ example: 'JOAO DA SILVA', description: 'Nome impresso no cartão' })
  @IsString()
  @IsNotEmpty()
  cardHolder: string;

  @ApiProperty({ example: '12', description: 'Mês de expiração (MM)' })
  @IsString()
  @IsNotEmpty()
  expiryMonth: string;

  @ApiProperty({ example: '2028', description: 'Ano de expiração (AAAA)' })
  @IsString()
  @IsNotEmpty()
  expiryYear: string;

  @ApiProperty({ example: '123', description: 'Código de segurança (CVV)' })
  @IsString()
  @IsNotEmpty()
  cvv: string;

  @ApiProperty({
    example: 'VISA',
    enum: ['VISA', 'MASTERCARD', 'ELO'],
    description: 'Bandeira do cartão',
  })
  @IsEnum(['VISA', 'MASTERCARD', 'ELO'])
  brand: 'VISA' | 'MASTERCARD' | 'ELO';

  @ApiProperty({ example: 3, description: 'Número de parcelas (1-21)' })
  @IsInt()
  @Min(1)
  @Max(21)
  installments: number;

  @ApiProperty({
    example: 5.49,
    description:
      'Taxa percentual exata correspondente à bandeira e parcelas conforme tabela de taxas',
  })
  @IsNumber()
  feePercent: number;

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
      'ID do link de checkout. Quando informado, o servidor valida o status ativo, expiração, método permitido, valor fixo, limite de parcelas e referência de conciliação.',
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
