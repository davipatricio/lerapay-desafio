import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LinkGatewayDto {
  @ApiProperty({
    example: '12345678909',
    description: 'Documento (CPF ou CNPJ) cadastrado no gateway Lera Box',
  })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({
    example: 'SenhaGateway123',
    description: 'Senha recebida por e-mail enviada pelo gateway Lera Box',
  })
  @IsString()
  @IsNotEmpty()
  gatewayPassword: string;
}
