import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'joao@example.com',
    description: 'E-mail ou documento (CPF/CNPJ) do usuário',
  })
  @IsString()
  @IsNotEmpty()
  emailOrDocument: string;

  @ApiProperty({
    example: 'SenhaSegura123',
    description: 'Senha de acesso à conta BaaS',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    example: 'GatewayPassword123',
    description:
      'Opcional: senha do gateway recebida por e-mail. Se fornecida, autentica e vincula/renova automaticamente o token de lojista no gateway.',
  })
  @IsOptional()
  @IsString()
  gatewayPassword?: string;
}
