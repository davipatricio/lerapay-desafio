import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiPropertyOptional({
    example: '12345678909',
    description: 'Document (CPF/CNPJ) registered on gateway',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    example: 'joao@example.com',
    description: 'Email registered on gateway',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
