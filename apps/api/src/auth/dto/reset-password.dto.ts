import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiPropertyOptional({
    example: '12345678909',
    description: 'Documento (CPF/CNPJ) cadastrado no gateway Lera Box',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    example: 'joao@example.com',
    description: 'E-mail cadastrado no gateway Lera Box',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
