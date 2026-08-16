import 'express';
import type { User } from '../../users/entities/user.entity';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      user?: User;
    }
  }
}

export {};
