import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  AuthResponseDto,
  LinkGatewayDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UserProfileDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastra uma nova conta de lojista no BaaS e solicita a criação no gateway Lera Box',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuário cadastrado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'E-mail ou documento (CPF/CNPJ) já cadastrado',
  })
  public async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Autentica lojista no BaaS via e-mail/documento e senha (opcionalmente recebe a senha do gateway para renovar o token)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Autenticação realizada com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Credenciais inválidas',
  })
  public async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicita a redefinição de senha da conta do lojista no gateway Lera Box',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Solicitação de redefinição de senha processada com sucesso',
  })
  public async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.resetPassword(dto);
  }

  @Post('link-gateway')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Vincula de forma segura as credenciais do gateway Lera Box à conta autenticada no BaaS',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conta do gateway vinculada com sucesso',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Credenciais do gateway inválidas ou sessão expirada',
  })
  public async linkGateway(
    @CurrentUser('id') userId: string,
    @Body() dto: LinkGatewayDto,
  ): Promise<UserProfileDto> {
    return this.authService.linkGateway(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retorna o perfil do usuário autenticado no BaaS e o status do vínculo com o gateway',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil do usuário atual',
    type: UserProfileDto,
  })
  public async getMe(@CurrentUser() user: User): Promise<UserProfileDto> {
    return this.authService.getMe(user);
  }
}
