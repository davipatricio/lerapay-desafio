import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponseDto, LinkGatewayDto, LoginDto, RegisterDto, UserProfileDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new BaaS merchant account and trigger Lera Box Gateway user creation',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or document already exists',
  })
  public async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Authenticate BaaS merchant using email/document and password (optionally passes gateway password to renew token)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authentication successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  public async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('link-gateway')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Securely link Lera Box Gateway credentials to the authenticated BaaS account',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gateway account linked successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid gateway credentials or session expired',
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
    summary: 'Get profile of current authenticated BaaS user and gateway link status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user profile',
    type: UserProfileDto,
  })
  public async getMe(@CurrentUser() user: User): Promise<UserProfileDto> {
    return this.authService.getMe(user);
  }
}
