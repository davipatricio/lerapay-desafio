import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { User } from '../../users/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | unknown => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: User }>();
    const user = request.user;

    return data && user ? user[data] : user;
  },
);
