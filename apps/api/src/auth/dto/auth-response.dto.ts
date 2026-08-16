import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PersonType } from '../../users/entities/user.entity';

export class GatewayAccountSummaryDto {
  @ApiProperty({ example: 'cli_abc123', nullable: true })
  codeClient?: string;

  @ApiProperty({ example: 'loja_xyz789', nullable: true })
  chaveLoja?: string;

  @ApiProperty({ example: true })
  isLinked: boolean;

  @ApiPropertyOptional({ example: '2026-08-16T12:00:00.000Z', nullable: true })
  tokenExpiresAt?: Date;
}

export class UserProfileDto {
  @ApiProperty({ example: 'd3b07384-d113-40e1-93c6-302302302302' })
  id: string;

  @ApiProperty({ example: 'João da Silva' })
  name: string;

  @ApiProperty({ example: 'joao@example.com' })
  email: string;

  @ApiProperty({ example: '12345678909' })
  document: string;

  @ApiProperty({ example: '11987654321', nullable: true })
  phone?: string;

  @ApiProperty({ enum: ['PF', 'PJ'], example: 'PF' })
  personType: PersonType;

  @ApiPropertyOptional({ example: 'Silva Comércio', nullable: true })
  tradingName?: string;

  @ApiProperty({ type: () => GatewayAccountSummaryDto })
  gatewayAccount?: GatewayAccountSummaryDto;

  @ApiProperty({ example: '2026-08-15T12:00:00.000Z' })
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'BaaS JWT Bearer token',
  })
  accessToken: string;

  @ApiProperty({ type: () => UserProfileDto })
  user: UserProfileDto;

  @ApiPropertyOptional({
    example: 'User registered successfully and gateway creation requested',
  })
  message?: string;
}
