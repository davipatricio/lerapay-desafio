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
  @ApiProperty({ example: 'João da Silva', description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'joao@example.com', description: 'Valid email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SenhaSegura123', minLength: 6, description: 'BaaS password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '12345678909', description: 'CPF or CNPJ without formatting' })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({ example: '11987654321', description: 'Contact phone with area code' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ enum: ['PF', 'PJ'], default: 'PF', description: 'Individual or Business' })
  @IsOptional()
  @IsEnum(['PF', 'PJ'])
  personType?: 'PF' | 'PJ';

  @ApiPropertyOptional({ example: 'Silva Comércio', description: 'Trading name for PJ' })
  @IsOptional()
  @IsString()
  tradingName?: string;

  // Address fields for automatic gateway registration
  @ApiPropertyOptional({ example: '01001000', description: 'ZIP code' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'Praça da Sé', description: 'Street address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '100', description: 'Address number' })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional({ example: 'Sé', description: 'Neighborhood' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'São Paulo', description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SP', description: 'State acronym' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Whether to automatically register this user on Lera Box Gateway',
  })
  @IsOptional()
  @IsBoolean()
  autoRegisterGateway?: boolean;
}
