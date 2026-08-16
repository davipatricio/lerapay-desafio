import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
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

  // Campos de endereço obrigatórios para cadastro no gateway Lera Box
  @ApiProperty({ example: '01001000', description: 'CEP (8 dígitos, com ou sem pontuação)' })
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP deve conter 8 dígitos' })
  zipCode: string;

  @ApiProperty({ example: 'Praça da Sé', description: 'Logradouro / Endereço' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Logradouro não pode ficar vazio' })
  address: string;

  @ApiProperty({ example: '100', description: 'Número do endereço' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Número não pode ficar vazio' })
  number: string;

  @ApiProperty({ example: 'Sé', description: 'Bairro' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Bairro não pode ficar vazio' })
  neighborhood: string;

  @ApiProperty({ example: 'São Paulo', description: 'Cidade / Município' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Cidade não pode ficar vazia' })
  city: string;

  @ApiProperty({ example: 'SP', description: 'Sigla do Estado (UF)' })
  @IsString()
  @Matches(/^[A-Za-z]{2}$/, { message: 'Estado deve ser informado com 2 letras' })
  state: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Indica se o usuário deve ser cadastrado automaticamente no gateway Lera Box',
  })
  @IsOptional()
  @IsBoolean()
  autoRegisterGateway?: boolean;
}
