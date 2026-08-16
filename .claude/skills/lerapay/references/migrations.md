# Database Migrations Reference

This guide documents how TypeORM migrations are run in `apps/api`. The approach is deliberate: migrations are executed against the **compiled** `dist/data-source.js`, not via a TypeScript runner like `ts-node` or `tsx`.

## 1. Why Compiled `dist` (and not `ts-node` / `tsx`)

The `User` and `GatewayAccount` entities declare most columns **without** an explicit SQL `type`:

```typescript
// apps/api/src/users/entities/user.entity.ts
@Column({ unique: true }) email: string;   // no `type`!
@Column() name: string;
```

TypeORM infers `varchar` from the `design:type` decorator metadata (`string` → `varchar`). That metadata only exists when the compiler emits `emitDecoratorMetadata: true` (set in `apps/api/tsconfig.json`).

- **`ts-node`** = real `tsc` under the hood → emits the metadata → column types resolve correctly. ✅
- **`tsx`** (esbuild) and **`node --experimental-strip-types`** → do **not** emit decorator metadata → untyped `@Column()` columns lose their SQL type → generated migrations produce wrong/empty schemas. ❌

Because this is a NestJS + TypeORM app that already builds to `dist/` via `nest build` (real `tsc`), the cleanest and safest flow is to **compile once, then point the plain `typeorm` CLI at the compiled DataSource**. No extra TS-runner dependency, no metadata trap.

> Note: `apps/api/tsconfig.json` intentionally omits `incremental`. With `nest-cli.json` `deleteOutDir: true`, an `incremental` build-info file would convince `tsc` the outputs are current after `nest start` wipes `dist/`, causing `Cannot find module dist/main` on boot.

---

## 2. Files Involved

- **`apps/api/src/data-source.ts`** — the CLI `DataSource`. Loads `.env` via `dotenv/config`, reads `process.env` for connection, globs the **compiled** output:
  ```typescript
  export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USER ?? 'app',
    password: process.env.DB_PASSWORD ?? 'app',
    database: process.env.DB_NAME ?? 'app',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
  });
  ```
  The CLI uses this file directly — it does **not** go through Nest's `ConfigModule` (runtime DI), so the connection must be read from `process.env` itself.
- **`apps/api/src/app.module.ts`** — `TypeOrmModule.forRootAsync` uses `synchronize: false` + `migrationsRun: true` + a `migrations` glob, so the app auto-applies pending migrations on boot instead of auto-syncing the schema.
- **`apps/api/package.json`** — `dotenv` dev dependency plus the `migration:*` scripts (all target `dist/data-source.js`).

---

## 3. Commands

All commands require a prior `nest build` (the scripts reference `dist/`).

| Script | CLI equivalent | Purpose |
|---|---|---|
| `pnpm --filter @lerapay/api build` | `nest build` | Compile `src` → `dist` (required first). |
| `pnpm --filter @lerapay/api migration:create src/migrations/Name` | `typeorm -d dist/data-source.js migration:create` | Empty migration scaffold. |
| `pnpm --filter @lerapay/api migration:generate src/migrations/Name` | `typeorm -d dist/data-source.js migration:generate` | Diff entities vs DB → writes SQL. |
| `pnpm --filter @lerapay/api migration:run` | `typeorm -d dist/data-source.js migration:run` | Apply pending migrations. |
| `pnpm --filter @lerapay/api migration:show` | `typeorm -d dist/data-source.js migration:show` | Show applied vs pending. |
| `pnpm --filter @lerapay/api migration:revert` | `typeorm -d dist/data-source.js migration:revert` | Undo the last batch. |

---

## 4. Daily Workflow

```sh
# 1. Always compile first — the DataSource and entities live in dist/
pnpm --filter @lerapay/api build

# 2. Generate a migration from entity changes (writes src/migrations/<ts>-Name.ts)
pnpm --filter @lerapay/api migration:generate src/migrations/AddWalletTable

# 3. Recompile so the new migration is emitted to dist/migrations/*.js
pnpm --filter @lerapay/api build

# 4. Apply it
pnpm --filter @lerapay/api migration:run
```

The generated `.ts` migration is committed to source control; `nest build` compiles it alongside everything else.

---

## 5. Adopting Migrations on an Existing Database

When switching a database that was previously built by `synchronize`, generate a clean baseline:

```sh
pnpm --filter @lerapay/api build
pnpm --filter @lerapay/api exec typeorm -d dist/data-source.js schema:drop   # clears dev schema
pnpm --filter @lerapay/api migration:generate src/migrations/Init            # empty DB -> full schema
pnpm --filter @lerapay/api build
pnpm --filter @lerapay/api migration:run
```

`schema:drop` removes all tables (dev data is throwaway). Generating `Init` against an empty database produces the full `CREATE TABLE` set, which `migration:run` then recreates idempotently. Do **not** run `schema:drop` against non-dev databases.

---

## 6. Gotchas

- **Build before migrating.** The scripts target `dist/data-source.js` and the compiled entities/migrations. Forgetting `build` means the CLI runs against a stale or missing `dist`.
- **`synchronize` vs `migrationsRun`.** Keep `synchronize: false` in every environment once migrations are adopted — leaving it `true` makes TypeORM and the migration runner fight over schema ownership.
- **Explicit `type` when possible.** New columns should specify `type` (e.g. `@Column({ type: 'text' })`) to reduce reliance on decorator metadata inference, but the compiled-`dist` pipeline handles inferred types correctly regardless.
