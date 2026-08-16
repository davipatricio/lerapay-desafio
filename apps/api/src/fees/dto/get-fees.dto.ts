import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class GetFeesQueryDto {
  @ApiPropertyOptional({
    enum: ['VISA', 'MASTERCARD', 'ELO'],
    description: 'Filter fee table by card brand',
  })
  @IsOptional()
  @IsEnum(['VISA', 'MASTERCARD', 'ELO'])
  brand?: 'VISA' | 'MASTERCARD' | 'ELO';
}
