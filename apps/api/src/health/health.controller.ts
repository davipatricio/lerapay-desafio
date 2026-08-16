import { Controller, Get, HttpStatus, Optional } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('saúde')
@Controller('health')
export class HealthController {
  constructor(@Optional() private readonly dataSource?: DataSource) {}

  @Get()
  @ApiOperation({
    summary: 'Verifica a integridade da API e o status de conexão com o banco de dados',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Informações sobre a saúde e integridade do sistema',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2026-08-15T12:00:00.000Z' },
        uptime: { type: 'number', example: 12.34 },
        database: { type: 'string', example: 'connected' },
      },
    },
  })
  check() {
    let dbStatus = 'disconnected';
    if (this.dataSource?.isInitialized) {
      dbStatus = 'connected';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
    };
  }
}
