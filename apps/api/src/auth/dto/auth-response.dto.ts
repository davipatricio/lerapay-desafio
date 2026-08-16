import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PersonType } from '../../users/entities/user.entity';

export class GatewayAccountSummaryDto {
  @ApiProperty({
    example: 'cli_abc123',
    nullable: true,
    description: 'Código do cliente no gateway Lera Box',
  })
  codeClient?: string;

  @ApiProperty({
    example: 'loja_xyz789',
    nullable: true,
    description: 'Chave da loja no gateway Lera Box',
  })
  chaveLoja?: string;

  @ApiProperty({ example: true, description: 'Indica se a conta está vinculada ao gateway' })
  isLinked: boolean;

  @ApiPropertyOptional({
    example: '2026-08-16T12:00:00.000Z',
    nullable: true,
    description: 'Data e hora de expiração do token do gateway',
  })
  tokenExpiresAt?: Date | null;
}

export class UserProfileDto {
  @ApiProperty({
    example: 'd3b07384-d113-40e1-93c6-302302302302',
    description: 'ID único do usuário',
  })
  id: string;

  @ApiProperty({ example: 'João da Silva', description: 'Nome completo do usuário' })
  name: string;

  @ApiProperty({ example: 'joao@example.com', description: 'Endereço de e-mail do usuário' })
  email: string;

  @ApiProperty({ example: '12345678909', description: 'Documento (CPF ou CNPJ) sem formatação' })
  document: string;

  @ApiProperty({
    example: '11987654321',
    nullable: true,
    description: 'Telefone de contato com DDD',
  })
  phone?: string;

  @ApiProperty({
    enum: ['PF', 'PJ'],
    example: 'PF',
    description: 'Tipo de pessoa: PF (Física) ou PJ (Jurídica)',
  })
  personType: PersonType;

  @ApiPropertyOptional({
    example: 'Silva Comércio',
    nullable: true,
    description: 'Nome fantasia (PJ)',
  })
  tradingName?: string;

  @ApiProperty({
    type: () => GatewayAccountSummaryDto,
    description: 'Resumo da conta vinculada no gateway',
  })
  gatewayAccount?: GatewayAccountSummaryDto;

  @ApiProperty({
    example: '2026-08-15T12:00:00.000Z',
    description: 'Data e hora de criação do cadastro',
  })
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT Bearer de autenticação no BaaS',
  })
  accessToken: string;

  @ApiProperty({
    type: () => UserProfileDto,
    description: 'Dados do perfil do usuário autenticado',
  })
  user: UserProfileDto;

  @ApiPropertyOptional({
    example: 'Usuário cadastrado com sucesso e criação no gateway solicitada',
    description: 'Mensagem informativa sobre o resultado da operação',
  })
  message?: string;
}
