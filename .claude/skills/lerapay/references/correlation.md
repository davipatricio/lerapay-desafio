# Correlation, Context & Logging Reference

This guide details the correlation ID propagation, execution context management via Node's `AsyncLocalStorage`, and structured HTTP logging across `apps/api`.

## 1. Overview & Data Flow

Every HTTP request entering the NestJS backend is wrapped in an isolated `AsyncLocalStorage` store, generating or forwarding a unique `correlationId` that follows the request across all async boundaries, database calls, gateway API interactions, and log messages.

```
Incoming HTTP Request
        |
        v
[ CorrelationIdMiddleware ]
  - Reads `x-correlation-id` (or `x-request-id` / `x-correlationid`) or generates crypto.randomUUID()
  - Injects `x-correlation-id` into Response Headers
  - Wraps downstream execution in `RequestContextService.run(store, next)`
        |
        v
[ HttpLoggerMiddleware ]
  - Measures duration (start -> finish event)
  - Emits structured log with `[correlationId]` prefix (Log: 2xx/3xx, Warn: 4xx, Error: 5xx)
        |
        v
[ JwtAuthGuard ]
  - Populates ambient `userId` and `token` (merchant gateway token) into `RequestContextService`
        |
        v
[ Controllers & Domain Services ]
  - Access `correlationId`, `userId`, and `token` via `RequestContextService` without argument drilling
```

---

## 2. RequestContextService & AsyncLocalStorage

Located at `apps/api/src/common/context/request-context.service.ts`:

```typescript
export interface RequestContextStore {
  correlationId: string;
  userId?: string;
  token?: string;
  ip?: string;
  method?: string;
  path?: string;
  [key: string]: unknown;
}
```

### Accessing Context in Any Service

```typescript
@Injectable()
export class AnyDomainService {
  private readonly logger = new Logger(AnyDomainService.name);

  constructor(
    private readonly requestContextService: RequestContextService,
  ) {}

  public doSomething() {
    const correlationId = this.requestContextService.getCorrelationId();
    const userId = this.requestContextService.getUserId();
    const gatewayToken = this.requestContextService.getToken();

    this.logger.log(`[${correlationId}] Processing action for user ${userId}`);
  }
}
```

---

## 3. Middleware Configuration

Registered in `apps/api/src/app.module.ts`:

```typescript
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationIdMiddleware, HttpLoggerMiddleware)
      .forRoutes({ path: '*wildcard', method: RequestMethod.ALL });
  }
}
```

### `CorrelationIdMiddleware` (`apps/api/src/common/middleware/correlation-id.middleware.ts`)
- Header name constant: `export const CORRELATION_ID_HEADER = 'x-correlation-id';`
- Inspects `x-correlation-id`, `x-request-id`, `x-correlationid`.
- Sets `req.correlationId = correlationId`.
- Sets `res.setHeader('x-correlation-id', correlationId)`.
- Invokes `RequestContextService.run(store, next)`.

### `HttpLoggerMiddleware` (`apps/api/src/common/middleware/http-logger.middleware.ts`)
- Structured log format:
  ```
  [<correlationId>] <METHOD> <URL> <STATUS_CODE> <CONTENT_LENGTH>b - <DURATION>ms - <IP> <USER_AGENT>
  ```
- Example:
  ```
  [a1b2c3d4-e5f6-7890-abcd-ef1234567890] POST /api/auth/login 200 482b - 18ms - 127.0.0.1 Mozilla/5.0...
  ```

---

## 4. TypeScript Declaration Merging

Located at `apps/api/src/common/types/express.d.ts`:

```typescript
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
```

This allows accessing `req.correlationId` and `req.user` without `as any` typecasts across controllers, middleware, and guards.

---

## 5. Health Check Verification

The `/api/health` endpoint (`apps/api/src/health/health.controller.ts`) verifies the entire middleware and context pipeline:

```typescript
@Get()
public check() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    correlationId: this.requestContextService.getCorrelationId(),
  };
}
```

A response will always include the active correlation ID both in the JSON payload and in the `x-correlation-id` HTTP response header.
