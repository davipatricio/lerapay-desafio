import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LinkGatewayDto {
  @ApiProperty({ example: '12345678909', description: 'CPF/CNPJ registered in Lera Box Gateway' })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({
    example: 'SenhaGateway123',
    description: 'Password received by email from the Lera Box Gateway',
  })
  @IsString()
  @IsNotEmpty()
  gatewayPassword: string;
}
