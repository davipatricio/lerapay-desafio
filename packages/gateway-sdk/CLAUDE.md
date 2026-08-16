# packages/gateway-sdk — `@lerapay/gateway-sdk`

Typed SDK for the Lera Box / BranchPay Sandbox Gateway. This file is scoped to this package; for monorepo-wide conventions (tooling, catalogs, workspace layout) see the root [`CLAUDE.md`](../../CLAUDE.md).

## Stack

- **Framework**: TypeScript 7.0.2 (`catalog:frontend`), ESM modules
- **HTTP Client**: `ofetch` for type-safe API calls
- **Bundler**: `tsdown` (ESM bundle + `.d.ts` declaration generation via `tsgo`)
- **Lint/Format**: `oxlint` + `oxfmt` (not ESLint/Prettier), per the monorepo standard

## Key conventions (established in `src/`)

These reflect how the scaffold is wired — match them when adding code:

- **Exported API**:
  - `BranchPayClient` — main client class for API interactions
  - `verifyWebhookSignature` — utility for verifying webhook signatures
  - Typed DTO interfaces for all request/response payloads
- **Type Safety**: All API responses are typed; use the exported interfaces for request/response payloads
- **Error Handling**: `BranchPayError` class for gateway-specific errors; check `isBranchPayError` helper
- **ESM-only**: Package is ESM-only; use `import` syntax in all source files
- **Build Output**: `dist/` contains ESM bundle and TypeScript declarations

## Project layout

```
packages/gateway-sdk
├── package.json            # ESM, exports map, scripts
├── tsconfig.json           # strict, module: ESNext
├── tsdown.config.ts        # tsdown bundler config
├── src/
│   ├── index.ts            # Public API exports
│   ├── client.ts           # BranchPayClient implementation
│   ├── types.ts            # DTO interfaces
│   ├── errors.ts           # BranchPayError + helpers
│   └── utils.ts            # verifyWebhookSignature + other utilities
└── dist/                   # Build output (gitignored)
```

## Adding New API Methods

1. Add the DTO interface to `src/types.ts`
2. Add the method to `BranchPayClient` in `src/client.ts`
3. Export the new type from `src/index.ts`
4. Run `pnpm --filter @lerapay/gateway-sdk build` to verify

## Environment

No `.env` required for local dev. The SDK is framework-agnostic and can be consumed by any app.

## Commands

Run from this package via `pnpm --filter @lerapay/gateway-sdk <script>` (or `turbo run <script> --filter @lerapay/gateway-sdk`):

| Script         | Command           | Purpose                                 |
| -------------- | ----------------- | --------------------------------------- |
| `build`        | `tsdown`          | Build ESM bundle + `.d.ts` declarations |
| `typecheck`    | `tsc --noEmit`    | Type-check (no emit)                    |
| `lint`         | `oxlint .`        | Lint with oxlint                        |
| `lint:fix`     | `oxlint . --fix`  | Auto-fix lint issues                    |
| `format`       | `oxfmt .`         | Format with oxfmt                       |
| `format:check` | `oxfmt --check .` | Verify formatting                       |

## Usage

```ts
import { BranchPayClient, type PaymentRequest } from '@lerapay/gateway-sdk';

const client = new BranchPayClient({ apiKey: '...' });
const payment: PaymentRequest = { amount: 1000, currency: 'BRL' };
const result = await client.createPayment(payment);
```
