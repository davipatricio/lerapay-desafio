# apps/api — `@lerapay/api`

NestJS 11 backend service for the LeraPay monorepo. This file is scoped to this package; for monorepo-wide conventions (tooling, catalogs, workspace layout) see the root [`CLAUDE.md`](../../CLAUDE.md).

## Stack

- **Framework**: NestJS 11 (`@nestjs/core` 11.2.0), CommonJS modules, `ES2022` target.
- **Language**: TypeScript 6.0.3 (`catalog:backend`).
- **Database**: TypeORM 1.1. → MySQL 8.4 (driver `mysql2`).
- **Validation**: `class-validator` + `class-transformer` via a global `ValidationPipe`.
- **Docs**: OpenAPI / Swagger (`@nestjs/swagger`) served at `/docs`.
- **Config**: `@nestjs/config` (`ConfigModule.forRoot` registered globally in `AppModule`).

## Key conventions (established in `src/`)

These are already wired in `src/main.ts` and `src/app.module.ts` — match them when adding code:

- **Global prefix `/api`** — every route is served under `/api`. Do not add `api` to individual route paths.
- **CORS is enabled** (`app.enableCors()`) with default settings.
- **Global `ValidationPipe`** with `whitelist: true` and `forbidNonWhitelisted: true`. Incoming bodies are validated against DTOs: unknown properties are stripped, and non-whitelisted properties reject the request. Always define explicit DTO classes for request bodies (`class-validator` decorators), and enable `transform: true` by relying on the pipe to coerce primitives.
- **TypeORM `forRootAsync`** is configured in `AppModule` (`src/app.module.ts`):
  - `autoLoadEntities: true` — entities are registered automatically when imported via `TypeOrmModule.forFeature([...])` in feature modules. Do **not** list them manually in `entities: []`.
  - `synchronize` is `true` outside production and `false` in production. Schema is kept in sync automatically in dev; production relies on migrations (none yet — add a migration strategy before shipping).
- **ConfigService** is the single source of DB/host config (with localhost defaults), injected via `useFactory` in `AppModule`.

## Project layout

```
apps/api
├── nest-cli.json        # @nestjs/schematics, sourceRoot=src, deleteOutDir
├── tsconfig.json        # strict, decorators enabled
├── tsconfig.build.json
├── .env.example         # PORT, DB_HOST/PORT/USER/PASSWORD/NAME
└── src
    ├── main.ts          # bootstrap: prefix, CORS, ValidationPipe, Swagger
    └── app.module.ts    # ConfigModule + TypeOrmModule.forRootAsync
```

The app currently has no feature modules/controllers/entities. When adding a domain (e.g. `users`), follow NestJS conventions:

- Create a feature module: `users/users.module.ts` importing `TypeOrmModule.forFeature([User])`.
- Register it in `AppModule.imports`.
- Define entities with TypeORM decorators and DTOs with `class-validator` decorators.
- Expose routes via `@Controller()` with the global `/api` prefix already applied.

Use the NestJS CLI schematics style (`@nestjs/schematics`) for consistency.

## Environment

Copy `.env.example` to `.env` for local runs. Defaults point at the Dockerized MySQL from the root compose (`localhost:3306`, `app`/`app`/`app`).

## Commands

Run from this package via `pnpm --filter @lerapay/api <script>` (or `turbo run <script> --filter @lerapay/api`):

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `nest start --watch` | Start with file watching |
| `build` | `nest build` | Compile to `dist/` |
| `start` | `nest start` | Run once |
| `start:prod` | `node dist/main.js` | Run compiled output |
| `typecheck` | `tsc --noEmit` | Type-check (no emit) |
| `lint` | `oxlint .` | Lint with oxlint |
| `lint:fix` | `oxlint . --fix` | Auto-fix lint issues |
| `format` | `oxfmt .` | Format with oxfmt |
| `format:check` | `oxfmt --check .` | Verify formatting |

Linting/formatting use `oxlint`/`oxfmt` (not ESLint/Prettier), per the monorepo standard.

## Service endpoints

- API base: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/docs`
- Port overridable via `PORT` (default `3000`).

## API contract (sandbox gateway)

The full OpenAPI 3.0.0 contract for the simulated gateway (all `/api/*` routes, the `bearer` JWT
security scheme, and the request DTO schemas) is kept as reference documentation at
[`docs/gateway.md`](./docs/gateway.md). It mirrors the live Swagger UI and is the source of truth
for integrators — when changing a route, its security, or a DTO, keep that file in sync.
