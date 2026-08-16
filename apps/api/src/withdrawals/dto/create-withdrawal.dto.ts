import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({
    example: 10000,
    description: 'Valor do saque em centavos (ex.: 10000 = R$ 100,00)',
  })
  @IsInt()
  @IsPositive()
  @Min(100)
  amount: number;

  @ApiProperty({ example: 'joao@example.com', description: 'Chave Pix de destino para o saque' })
  @IsString()
  @IsNotEmpty()
  pixKey: string;

  @ApiPropertyOptional({
    enum: ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'],
    default: 'CPF',
    description: 'Tipo da chave Pix',
  })
  @IsOptional()
  @IsEnum(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'])
  pixKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

  @ApiPropertyOptional({
    example: '12345678909',
    description: 'Documento (CPF/CNPJ) do titular da chave Pix (padrão: documento do lojista)',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    example: 'Transferência de saldo',
    description: 'Descrição opcional do saque',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
