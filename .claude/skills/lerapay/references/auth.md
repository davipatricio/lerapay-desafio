# Auth Handling & Gateway Accounts Reference

This guide details the authentication, merchant onboarding, gateway linkage, and credential isolation patterns implemented in `apps/api`.

## 1. Dual-Token Architecture

The BaaS architecture segregates consumer/merchant web sessions from underlying payment gateway credentials:

```
[ Frontend (React) ]
        |
        | (1) BaaS JWT Bearer Token
        v
[ BaaS API (NestJS) ] --(2) Gateway Bearer Token (merchant_token)--> [ Lera Box Gateway ]
        |
        +--> [ MySQL: users + gateway_accounts ]
```

- **BaaS JWT (`@nestjs/jwt`)**: Short or long-lived JWT issued to merchants upon login/registration. Contains `{ sub: userId, email }`.
- **Gateway Bearer Token (`merchant_token`)**: Received from Lera Box `POST /api/auth/login` and stored encrypted/safely in the `gateway_accounts` table.
- **Credential Hygiene**: Gateway passwords and gateway Bearer tokens are **never** returned in API responses or stored in frontend state. `AuthService.mapToProfile()` sanitizes all outgoing user DTOs.

---

## 2. Entities & Schema Design

### `User` Entity (`apps/api/src/users/entities/user.entity.ts`)
- `id` (UUID, Primary Key)
- `email` (Unique, lowercased & trimmed)
- `passwordHash` (bcrypt hash with salt rounds = 10)
- `name` (string)
- `document` (Unique, stripped of non-digits: CPF/CNPJ)
- `phone` (string, nullable)
- `personType` (`'PF' | 'PJ'`, default `'PF'`)
- `tradingName` (string, nullable)
- `gatewayAccount` (`OneToOne` relation to `GatewayAccount`)
- `createdAt`, `updatedAt` (Timestamps)

### `GatewayAccount` Entity (`apps/api/src/auth/entities/gateway-account.entity.ts`)
- `id` (UUID, Primary Key)
- `userId` (Foreign Key -> `users.id`, Unique)
- `merchantToken` (text, nullable — Bearer token for BranchPay API calls)
- `codeClient` (string, nullable — CodigoCliente from gateway)
- `chaveLoja` (string, nullable — ChaveLoja from gateway)
- `gatewayDocument` (string, nullable — Document used during gateway registration)
- `tokenExpiresAt` (Date, nullable)
- `isLinked` (boolean, default `false`)

---

## 3. Endpoints & Operations (`/api/auth/*`)

| Endpoint | Method | Guard | Description |
|---|---|---|---|
| `/api/auth/register` | `POST` | Public | Creates local `User`, creates `gateway_accounts` record, optionally triggers `gatewayService.createUser`, issues BaaS JWT. |
| `/api/auth/login` | `POST` | Public | Authenticates credentials (`emailOrDocument` + `password`). If optional `gatewayPassword` is provided, synchronously calls gateway login to refresh/link token. |
| `/api/auth/link-gateway` | `POST` | `JwtAuthGuard` | Explicitly links an existing gateway account via `document` + `gatewayPassword`, saving `merchantToken`, `codeClient`, and `chaveLoja`. |
| `/api/auth/me` | `GET` | `JwtAuthGuard` | Returns authenticated user profile and summary of gateway linkage (`isLinked`, `codeClient`, `chaveLoja`, `tokenExpiresAt`). |

---

## 4. Guard & Context Population (`JwtAuthGuard`)

`apps/api/src/auth/guards/jwt-auth.guard.ts`:
1. Extracts `Authorization: Bearer <token>` from HTTP headers.
2. Validates token via `jwtService.verifyAsync`. Catches verification errors and returns `401 Unauthorized` ("Invalid or expired authentication token").
3. Fetches the user via `usersService.findById(payload.sub)` (which eager-loads the `gatewayAccount` relation). Any unexpected database error correctly surfaces as a `500 Internal Server Error`.
4. Attaches typed `user` to `request.user` (typed via declaration merging in `express.d.ts`).
5. **Populates ambient execution context**:
   ```typescript
   this.requestContextService.setUserId(user.id);
   if (user.gatewayAccount?.merchantToken) {
     this.requestContextService.setToken(user.gatewayAccount.merchantToken);
   }
   ```

---

## 5. Decorator Usage (`@CurrentUser`)

`apps/api/src/auth/decorators/current-user.decorator.ts`:

```typescript
// In any controller method:
@Get('example')
@UseGuards(JwtAuthGuard)
public async getExample(
  @CurrentUser() user: User,
  @CurrentUser('id') userId: string,
) {
  // userId and user are fully typed
}
```

---

## 6. Calling Gateway on Behalf of Merchants

Downstream domain services (e.g. `CheckoutService`, `WalletService`, `WithdrawalsService`) must never use a static or global merchant token. Always use the ephemeral scoped client factory:

```typescript
// Pattern 1: Via explicit merchant token from user
const client = this.gatewayService.forToken(user.gatewayAccount.merchantToken);
const wallet = await client.getWallet();

// Pattern 2: Via ambient RequestContext
const token = this.requestContextService.getToken();
if (!token) {
  throw new UnauthorizedException('Gateway account is not linked');
}
const client = this.gatewayService.forToken(token);
const fees = await client.getFees();
```
