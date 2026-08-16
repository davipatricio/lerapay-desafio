import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({
    example: 10000,
    description: 'Withdrawal amount in centavos (e.g. 10000 = R$ 100,00)',
  })
  @IsInt()
  @IsPositive()
  @Min(100)
  amount: number;

  @ApiProperty({ example: 'joao@example.com', description: 'Pix destination key' })
  @IsString()
  @IsNotEmpty()
  pixKey: string;

  @ApiPropertyOptional({
    enum: ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'],
    default: 'CPF',
    description: 'Pix key type',
  })
  @IsOptional()
  @IsEnum(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'])
  pixKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

  @ApiPropertyOptional({
    example: '12345678909',
    description: 'Document of the Pix key owner (defaults to merchant document)',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ example: 'Transferência de saldo', description: 'Withdrawal description' })
  @IsOptional()
  @IsString()
  description?: string;
}
