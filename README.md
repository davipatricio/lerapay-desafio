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

## Docker & Containerização

### Subir a Stack Completa com Docker Compose

Para construir as imagens e iniciar todos os serviços (`mysql`, `api` e `web`) orquestrados com redes, volumes e healthchecks:

```sh
# Construir as imagens e subir os containers em segundo plano
docker compose up --build -d

# Acompanhar os logs dos serviços
docker compose logs -f

# Verificar status dos containers e healthchecks
docker compose ps

# Parar todos os serviços
docker compose down
```

### Construção Individual das Imagens Docker

Por se tratar de um monorepo com pacotes internos (`packages/gateway-sdk`), o contexto de execução do build deve ser sempre a **raiz do monorepo**:

```sh
# Build da imagem do Backend (apps/api - NestJS)
docker build -f apps/api/Dockerfile -t lerapay-api .

# Build da imagem do Frontend (apps/web - React Router 8 SSR)
docker build -f apps/web/Dockerfile -t lerapay-web .
```

