import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FeeTableItem } from '@lerapay/gateway-sdk';
import { FeeTableItemDto } from './dto/fee-table-item.dto';
import { GetFeesQueryDto } from './dto/get-fees.dto';
import { FeesService } from './fees.service';

@ApiTags('taxas')
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get()
  @ApiOperation({
    summary:
      'Obtém a tabela de taxas de parcelamento de cartão de crédito diretamente do gateway Lera Box',
  })
  @ApiResponse({
    status: 200,
    description: 'Itens da tabela de taxas',
    type: [FeeTableItemDto],
  })
  public async getFees(@Query() query: GetFeesQueryDto): Promise<FeeTableItem[]> {
    return this.feesService.getFees(query);
  }
}
