import {
  BadGatewayException,
  ConflictException,
  HttpException,
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
import type {
  AuthResponseDto,
  LinkGatewayDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UserProfileDto,
} from './dto';
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
      throw new ConflictException('E-mail já cadastrado');
    }

    const cleanDocument = dto.document.replace(/\D/g, '');
    const existingDoc = await this.usersService.findByDocument(cleanDocument);
    if (existingDoc) {
      throw new ConflictException('Documento (CPF/CNPJ) já cadastrado');
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

    // Cadastro automático no gateway Lera Box se solicitado
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

        // Login automático no gateway no cadastro para associar token e credenciais do lojista imediatamente
        try {
          await this.authenticateWithGateway(user, cleanDocument, dto.password);
        } catch (loginErr: any) {
          this.logger.debug(
            `Tentativa de login imediato no gateway após cadastro para o usuário ${user.id} retornou aviso: ${loginErr?.message || loginErr}`,
          );
        }
      } catch (err: any) {
        this.logger.warn(
          `Registro no gateway para o usuário ${user.id} retornou aviso: ${err?.message || err}`,
        );
        gatewayMessage =
          'Conta local criada. As credenciais do gateway serão enviadas por e-mail se o cadastro for processado com sucesso.';
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
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Se a senha do gateway foi informada, tenta vincular/renovar o token do gateway
    const gatewayPass = dto.gatewayPassword || dto.password;
    if (gatewayPass) {
      try {
        await this.authenticateWithGateway(user, user.document, gatewayPass);
      } catch (err: any) {
        this.logger.debug(
          `Tentativa de login no gateway para o usuário ${user.id} retornou aviso: ${err?.message || err}`,
        );
      }
    }

    return this.buildAuthResponse(user);
  }

  public async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    let cleanDoc = dto.document ? dto.document.replace(/\D/g, '') : undefined;
    let email = dto.email?.toLowerCase().trim();

    if (!cleanDoc && !email) {
      throw new ConflictException('Informe o documento (CPF/CNPJ) ou o e-mail');
    }

    if (!cleanDoc && email) {
      const user = await this.usersService.findByEmail(email);
      if (user) {
        cleanDoc = user.document;
      }
    } else if (cleanDoc && !email) {
      const user = await this.usersService.findByDocument(cleanDoc);
      if (user) {
        email = user.email;
      }
    }

    try {
      const res = await this.gatewayService.resetPassword({
        document: cleanDoc || '',
        email: email || '',
      });
      return res;
    } catch (err: any) {
      this.logger.warn(
        `Solicitação de redefinição de senha no gateway falhou: ${err?.message || err}`,
      );
      return {
        success: true,
        message:
          'Se a conta existir no gateway, as instruções de redefinição de senha foram enviadas.',
      };
    }
  }

  public async linkGateway(userId: string, dto: LinkGatewayDto): Promise<UserProfileDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const cleanDocument = dto.document.replace(/\D/g, '');
    try {
      await this.authenticateWithGateway(user, cleanDocument, dto.gatewayPassword);
    } catch (err: any) {
      if (err?.status === 401 || err?.data?.statusCode === 401) {
        throw new UnauthorizedException(
          'Credenciais do gateway inválidas. Use o documento e a senha enviados por e-mail pelo Lera Box, ou redefina a senha.',
        );
      }
      this.logger.warn(
        `Falha ao vincular gateway para o usuário ${user.id}: ${err?.message || err}`,
      );
      if (err instanceof HttpException) {
        throw err;
      }
      throw new BadGatewayException(
        'Falha na comunicação com o gateway Lera Box ao vincular credenciais.',
      );
    }

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
      user.gatewayAccount ?? this.gatewayAccountRepository.create({ userId: user.id });

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

  private async buildAuthResponse(user: User, message?: string): Promise<AuthResponseDto> {
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
