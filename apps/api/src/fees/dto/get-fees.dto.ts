import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class GetFeesQueryDto {
  @ApiPropertyOptional({
    enum: ['VISA', 'MASTERCARD', 'ELO'],
    description: 'Filtrar tabela de taxas pela bandeira do cartão',
  })
  @IsOptional()
  @IsEnum(['VISA', 'MASTERCARD', 'ELO'])
  brand?: 'VISA' | 'MASTERCARD' | 'ELO';
}
