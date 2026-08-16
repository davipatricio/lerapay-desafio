import { ApiProperty } from '@nestjs/swagger';

export class FeeTableItemDto {
  @ApiProperty({
    example: 'VISA',
    enum: ['VISA', 'MASTERCARD', 'ELO'],
    description: 'Bandeira do cartão de crédito',
  })
  brand: 'VISA' | 'MASTERCARD' | 'ELO';

  @ApiProperty({ example: 1, description: 'Número de parcelas (1-21)' })
  installments: number;

  @ApiProperty({ example: 3.99, description: 'Taxa percentual aplicada para esta parcela' })
  feePercent: number;
}
