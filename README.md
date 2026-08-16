# DESAFIO TÉCNICO - VBA System

## Estrutura do Monorepo

- `apps/api`: Backend NestJS
- `apps/web`: Frontend React Router 8 / React 19
- `packages/gateway-sdk`: SDK cliente TypeScript (`@lerapay/gateway-sdk`) para integração com a API do Gateway Lera Box / BranchPay

## Requisitos

- Node.js `26.7.0`
- pnpm `11`
- Docker Desktop

## Desenvolvimento

```sh
pnpm install
docker compose up -d mysql
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/docs

## Comandos

```sh
pnpm build
pnpm lint
pnpm format
pnpm format:check
pnpm typecheck
```

Build específico do SDK:

```sh
pnpm --filter @lerapay/gateway-sdk build
```
