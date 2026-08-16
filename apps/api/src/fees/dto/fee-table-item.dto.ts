import { ApiProperty } from '@nestjs/swagger';

export class FeeTableItemDto {
  @ApiProperty({ example: 'VISA', enum: ['VISA', 'MASTERCARD', 'ELO'] })
  brand: 'VISA' | 'MASTERCARD' | 'ELO';

  @ApiProperty({ example: 1, description: 'Number of installments (1-21)' })
  installments: number;

  @ApiProperty({ example: 3.99, description: 'Percentage fee for this installment' })
  feePercent: number;
}
