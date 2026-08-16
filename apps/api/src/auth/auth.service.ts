import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { GatewayService } from '../gateway/gateway.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import type { AuthResponseDto, LinkGatewayDto, LoginDto, RegisterDto, UserProfileDto } from './dto';
import { GatewayAccount } from './entities/gateway-account.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(GatewayAccount)
    private readonly gatewayAccountRepository: Repository<GatewayAccount>,
    private readonly gatewayService: GatewayService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    const cleanDocument = dto.document.replace(/\D/g, '');
    const existingDoc = await this.usersService.findByDocument(cleanDocument);
    if (existingDoc) {
      throw new ConflictException('Document (CPF/CNPJ) is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase().trim(),
      document: cleanDocument,
      phone: dto.phone.trim(),
      personType: dto.personType || 'PF',
      tradingName: dto.tradingName?.trim(),
      passwordHash,
    });

    const gatewayAccount = this.gatewayAccountRepository.create({
      userId: user.id,
      gatewayDocument: cleanDocument,
      isLinked: false,
    });
    await this.gatewayAccountRepository.save(gatewayAccount);
    user.gatewayAccount = gatewayAccount;

    let gatewayMessage: string | undefined;

    // Auto-register on Lera Box Gateway if requested
    if (dto.autoRegisterGateway !== false) {
      try {
        const gatewayRes = await this.gatewayService.createUser({
          personType: dto.personType || 'PF',
          name: dto.name.trim(),
          tradingName: dto.tradingName?.trim(),
          email: dto.email.toLowerCase().trim(),
          phone: dto.phone.trim(),
          document: cleanDocument,
          zipCode: dto.zipCode || '01001000',
          address: dto.address || 'Praça da Sé',
          number: dto.number || '1',
          neighborhood: dto.neighborhood || 'Centro',
          city: dto.city || 'São Paulo',
          state: dto.state || 'SP',
        });
        gatewayMessage = gatewayRes.message;
      } catch (err: any) {
        this.logger.warn(
          `Gateway registration for user ${user.id} returned notice: ${err?.message || err}`,
        );
        gatewayMessage =
          'Local account created. Gateway credentials will be sent if registration succeeds.';
      }
    }

    return this.buildAuthResponse(user, gatewayMessage);
  }

  public async login(dto: LoginDto): Promise<AuthResponseDto> {
    const isEmail = dto.emailOrDocument.includes('@');
    const user = isEmail
      ? await this.usersService.findByEmail(dto.emailOrDocument)
      : await this.usersService.findByDocument(dto.emailOrDocument);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If gateway password was provided, attempt linking/refreshing gateway token
    if (dto.gatewayPassword) {
      try {
        await this.authenticateWithGateway(user, user.document, dto.gatewayPassword);
      } catch (err: any) {
        this.logger.warn(`Gateway login for user ${user.id} failed: ${err?.message || err}`);
      }
    }

    return this.buildAuthResponse(user);
  }

  public async linkGateway(userId: string, dto: LinkGatewayDto): Promise<UserProfileDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const cleanDocument = dto.document.replace(/\D/g, '');
    await this.authenticateWithGateway(user, cleanDocument, dto.gatewayPassword);

    return this.mapToProfile(user);
  }

  public async getMe(user: User): Promise<UserProfileDto> {
    return this.mapToProfile(user);
  }

  private async authenticateWithGateway(
    user: User,
    document: string,
    gatewayPassword: string,
  ): Promise<void> {
    const gatewayLoginRes = await this.gatewayService.login({
      document,
      password: gatewayPassword,
    });

    const gatewayAccount =
      user.gatewayAccount ??
      this.gatewayAccountRepository.create({ userId: user.id });

    gatewayAccount.merchantToken = gatewayLoginRes.access_token;
    gatewayAccount.codeClient = gatewayLoginRes.code_client;
    gatewayAccount.chaveLoja = gatewayLoginRes.chave_loja;
    gatewayAccount.gatewayDocument = document;
    gatewayAccount.isLinked = true;
    gatewayAccount.tokenExpiresAt = new Date(
      Date.now() + (gatewayLoginRes.expires_in || 86400) * 1000,
    );

    await this.gatewayAccountRepository.save(gatewayAccount);
    user.gatewayAccount = gatewayAccount;
  }

  private async buildAuthResponse(
    user: User,
    message?: string,
  ): Promise<AuthResponseDto> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: this.mapToProfile(user),
      message,
    };
  }

  private mapToProfile(user: User): UserProfileDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      document: user.document,
      phone: user.phone,
      personType: user.personType,
      tradingName: user.tradingName,
      gatewayAccount: user.gatewayAccount
        ? {
            codeClient: user.gatewayAccount.codeClient,
            chaveLoja: user.gatewayAccount.chaveLoja,
            isLinked: user.gatewayAccount.isLinked,
            tokenExpiresAt: user.gatewayAccount.tokenExpiresAt,
          }
        : { isLinked: false },
      createdAt: user.createdAt,
    };
  }
}
