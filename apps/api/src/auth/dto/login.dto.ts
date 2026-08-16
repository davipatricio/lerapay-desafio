import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'joao@example.com', description: 'User email or CPF/CNPJ document' })
  @IsString()
  @IsNotEmpty()
  emailOrDocument: string;

  @ApiProperty({ example: 'SenhaSegura123', description: 'BaaS account password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    example: 'GatewayPassword123',
    description:
      'Optional: Gateway password received by email. If provided, automatically authenticates and links/refreshes the Gateway merchant token.',
  })
  @IsOptional()
  @IsString()
  gatewayPassword?: string;
}
