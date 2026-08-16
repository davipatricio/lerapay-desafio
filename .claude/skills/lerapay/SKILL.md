---
name: lerapay
description: Guidance, architectural rules, and implementation patterns for the LeraPay Banking as a Service (BaaS) monorepo.
---

# LeraPay BaaS Skill

This skill documents the architecture, conventions, domain workflows, and cross-cutting infrastructure for the **LeraPay BaaS** monorepo (VBA Systems Technical Challenge).

## Monorepo Architecture Overview

- **`apps/api` (`@lerapay/api`)**: NestJS 11 backend service.
  - **Database**: TypeORM 1.1 + MySQL 8.4 (banco próprio).
  - **Prefix & Security**: Global `/api` prefix, CORS enabled, global `ValidationPipe` with whitelist.
  - **Documentation**: Swagger OpenAPI at `/docs`.
  - **Gateway Integration**: 100% via `@lerapay/gateway-sdk` (`https://api.branchpay.com.br/api`).
  - **Migrations**: Run via the compiled `dist/data-source.js` (`typeorm -d dist/data-source.js ...`), not `ts-node`/`tsx` — entities rely on `emitDecoratorMetadata` for column-type inference. See [Database Migrations](references/migrations.md).
- **`apps/web` (`@lerapay/web`)**: React 19 + React Router 8 (framework mode) + Vite + Tailwind CSS v4 + TanStack Query v5.
- **`packages/gateway-sdk` (`@lerapay/gateway-sdk`)**: Typed SDK for Lera Box / BranchPay API, bundled as dual ESM/CJS with `tsdown`.
- **`.roadmap/`**: Project tracking, official challenge spec (`challenge-spec.md`), and progress matrix (`tracking.md`, `roadmap.md`).

## Core Rules & Non-Negotiables

1. **Own Database Isolation**: The BaaS maintains its own MySQL database. **Never** access the gateway's database directly. All interactions with Lera Box must occur through `@lerapay/gateway-sdk` via HTTP.
2. **Gateway Credential Safety**: The gateway password and merchant Bearer token are **never** returned to or exposed in the frontend. The BaaS issues its own JWT tokens to merchants.
3. **Monetary Values in Centavos**: All monetary amounts sent to, received from, or stored for the gateway are integers in **centavos** (e.g., `1000` = R$ 10,00).
4. **Correlation & Request Tracing**: All requests carry a `x-correlation-id` header propagated throughout the execution context and structured logs.
5. **Strict Package Isolation**: During multi-agent or concurrent workflows, only execute commands scoped to your assigned package (`pnpm --filter <package> ...`). Never run un-scoped format sweeps or checkouts.

## References

For detailed implementation patterns and architectural deep dives, consult the reference guides:

- **[Auth Handling & Gateway Accounts](references/auth.md)**: Dual-token model, `User` and `GatewayAccount` entities, `JwtAuthGuard`, `@CurrentUser`, `AuthService`, token renewal, and security hygiene.
- **[Correlation, Context & Logging](references/correlation.md)**: `AsyncLocalStorage`, `RequestContextService`, `CorrelationIdMiddleware`, `HttpLoggerMiddleware`, header handling, and ambient token propagation.
- **[Database Migrations](references/migrations.md)**: Compiled-`dist` migration workflow, why `ts-node`/`tsx` are avoided, `migration:*` scripts, and adopting migrations on an existing database.

## Domain Workflow Guidelines

When implementing new BaaS domains (fees, checkout links, wallet, withdrawals, webhooks):

1. **Protect Endpoints**: Apply `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()` to lojista-facing endpoints.
2. **Access Merchant Context**:
   - Use `@CurrentUser()` or `@CurrentUser('id')` in controllers to retrieve the authenticated `User`.
   - Retrieve ambient gateway credentials from `RequestContextService.getToken()` or use `gatewayService.forToken(merchantToken)` to ensure tenant isolation.
3. **Persist Local State**: Store local domain records (`checkout_links`, `orders`, `transactions`, `withdrawals`, `webhook_events`) with an `externalReference` aligning with gateway transactions.
4. **Handle Errors Gracefully**: Catch `BranchPayError`, log with correlation ID, and map to appropriate HTTP exceptions.
