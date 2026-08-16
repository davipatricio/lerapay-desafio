import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';

export class TransactionQueryDto {
  @ApiPropertyOptional({
    enum: ['APPROVED', 'DENIED', 'PENDING', 'EXPIRED', 'CANCELLED'],
    description: 'Filtra pelo status da transação',
  })
  @IsOptional()
  @IsEnum(['APPROVED', 'DENIED', 'PENDING', 'EXPIRED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({
    enum: ['PIX', 'CREDIT_CARD', 'WITHDRAWAL'],
    description: 'Filtra pelo tipo de transação',
  })
  @IsOptional()
  @IsEnum(['PIX', 'CREDIT_CARD', 'WITHDRAWAL'])
  type?: string;

  @ApiPropertyOptional({
    example: 50,
    description: 'Limite de transações a serem retornadas',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;
}
