# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture & Structure

This is a TypeScript monorepo (`@lerapay/monorepo`) managed with **pnpm 11** workspaces and **Turborepo**.

### Workspace Layout
- `apps/api` (`@lerapay/api`): NestJS 11 backend service.
  - **Database**: TypeORM connected to MySQL 8.4 (auto-loading entities, synchronized in non-production).
  - **HTTP API**: Prefix `/api`, CORS enabled, global `ValidationPipe` with whitelist & forbidNonWhitelisted.
  - **Documentation**: OpenAPI / Swagger UI served at `/docs`.
  - **TypeScript**: Uses backend catalog TypeScript version (`catalog:backend` -> `6.0.3`).
- `apps/web` (`@lerapay/web`): React Router 8 frontend application.
  - **Framework**: React 19, React Router v8 (route config in `app/routes.ts`).
  - **Styling & Bundling**: Vite with `@tailwindcss/vite` (Tailwind CSS v4).
  - **TypeScript**: Uses frontend catalog TypeScript version (`catalog:frontend` -> `7.0.2`).

### Shared Tooling & Catalog Management
- **Linter & Formatter**: Uses `oxlint` and `oxfmt` across the monorepo instead of ESLint/Prettier.
- **Dependency Catalogs**: Managed via `pnpm-workspace.yaml` under `catalog` and `catalogs`.

---

## Development & Operations

### Prerequisites
- Node.js `>=26.7.0`
- pnpm `11.21.0`
- Docker & Docker Compose (for MySQL)

### Service Endpoints
- Web App: `http://localhost:5173`
- API Base URL: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/docs`
- MySQL Database: `localhost:3306` (`DB_NAME=app`, `DB_USER=app`, `DB_PASSWORD=app`)

### Commands

#### Environment Setup
```sh
pnpm install
docker compose up -d mysql
```

#### Monorepo Commands (Turborepo)
- **Start Development Services**: `pnpm dev`
- **Build All Apps**: `pnpm build`
- **Lint**: `pnpm lint`
- **Fix Linting**: `pnpm lint:fix`
- **Check Formatting**: `pnpm format:check`
- **Format Code**: `pnpm format`
- **Typecheck**: `pnpm typecheck`

#### Package-Specific Commands
Run commands in a single app using `pnpm --filter`:
- **API Dev**: `pnpm --filter @lerapay/api dev`
- **API Build**: `pnpm --filter @lerapay/api build`
- **API Typecheck**: `pnpm --filter @lerapay/api typecheck`
- **Web Dev**: `pnpm --filter @lerapay/web dev`
- **Web Build**: `pnpm --filter @lerapay/web build`
- **Web Typecheck**: `pnpm --filter @lerapay/web typecheck`
