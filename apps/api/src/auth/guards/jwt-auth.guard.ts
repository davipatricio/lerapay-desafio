import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { RequestContextService } from '../../common/context/request-context.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly requestContextService: RequestContextService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Cabeçalho de autorização ausente ou inválido');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }

    // Apenas falhas na verificação do token mapeiam para 401; erros de consulta ao banco propagam como 500.
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; email: string }>(token);
    } catch {
      throw new UnauthorizedException('Token de autenticação inválido ou expirado');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou sessão expirada');
    }

    // Anexa usuário tipado à requisição Express
    request.user = user;

    // Preenche RequestContext para acesso de serviços em contexto
    this.requestContextService.setUserId(user.id);
    if (user.gatewayAccount?.merchantToken) {
      this.requestContextService.setToken(user.gatewayAccount.merchantToken);
    }

    return true;
  }
}
