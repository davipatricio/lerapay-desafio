import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'João da Silva', description: 'Nome completo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'joao@example.com', description: 'Endereço de e-mail válido' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SenhaSegura123',
    minLength: 6,
    description: 'Senha de acesso ao BaaS (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '12345678909', description: 'CPF ou CNPJ sem pontuação' })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({ example: '11987654321', description: 'Telefone de contato com DDD' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({
    enum: ['PF', 'PJ'],
    default: 'PF',
    description: 'Tipo de pessoa: PF (Física) ou PJ (Jurídica)',
  })
  @IsOptional()
  @IsEnum(['PF', 'PJ'])
  personType?: 'PF' | 'PJ';

  @ApiPropertyOptional({
    example: 'Silva Comércio',
    description: 'Nome fantasia para pessoa jurídica (PJ)',
  })
  @IsOptional()
  @IsString()
  tradingName?: string;

  // Campos de endereço para cadastro automático no gateway Lera Box
  @ApiPropertyOptional({ example: '01001000', description: 'CEP (apenas dígitos)' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'Praça da Sé', description: 'Logradouro / Endereço' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '100', description: 'Número do endereço' })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional({ example: 'Sé', description: 'Bairro' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'São Paulo', description: 'Cidade / Município' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SP', description: 'Sigla do Estado (UF)' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Indica se o usuário deve ser cadastrado automaticamente no gateway Lera Box',
  })
  @IsOptional()
  @IsBoolean()
  autoRegisterGateway?: boolean;
}
