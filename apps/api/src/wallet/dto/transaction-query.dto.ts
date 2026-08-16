import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';

export class TransactionQueryDto {
  @ApiPropertyOptional({
    enum: ['APPROVED', 'DENIED', 'PENDING', 'EXPIRED', 'CANCELLED'],
    description: 'Filter by transaction status',
  })
  @IsOptional()
  @IsEnum(['APPROVED', 'DENIED', 'PENDING', 'EXPIRED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({
    enum: ['PIX', 'CREDIT_CARD', 'WITHDRAWAL'],
    description: 'Filter by transaction type',
  })
  @IsOptional()
  @IsEnum(['PIX', 'CREDIT_CARD', 'WITHDRAWAL'])
  type?: string;

  @ApiPropertyOptional({ example: 50, description: 'Limit number of transactions returned' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;
}
