import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { RequestContextService } from '../context/request-context.service';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private readonly requestContextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const rawHeader =
      req.headers[CORRELATION_ID_HEADER] ||
      req.headers['x-request-id'] ||
      req.headers['x-correlationid'];

    const correlationId = (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader) || randomUUID();

    req.correlationId = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    const store = {
      correlationId,
      ip: req.ip,
      method: req.method,
      path: req.originalUrl || req.url,
    };

    this.requestContextService.run(store, next);
  }
}
