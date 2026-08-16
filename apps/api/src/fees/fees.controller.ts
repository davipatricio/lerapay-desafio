import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FeeTableItem } from '@lerapay/gateway-sdk';
import { FeeTableItemDto } from './dto/fee-table-item.dto';
import { GetFeesQueryDto } from './dto/get-fees.dto';
import { FeesService } from './fees.service';

@ApiTags('fees')
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve credit card installment fee tables directly from Lera Box Gateway',
  })
  @ApiResponse({
    status: 200,
    description: 'Fee table items',
    type: [FeeTableItemDto],
  })
  public async getFees(@Query() query: GetFeesQueryDto): Promise<FeeTableItem[]> {
    return this.feesService.getFees(query);
  }
}
