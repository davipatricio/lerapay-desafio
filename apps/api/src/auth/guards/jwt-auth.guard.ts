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
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    // Only token verification failures map to 401; user lookup errors surface as their natural 500s.
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; email: string }>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found or session expired');
    }

    // Attach typed user to Express request
    request.user = user;

    // Populate RequestContext for ambient service access
    this.requestContextService.setUserId(user.id);
    if (user.gatewayAccount?.merchantToken) {
      this.requestContextService.setToken(user.gatewayAccount.merchantToken);
    }

    return true;
  }
}
