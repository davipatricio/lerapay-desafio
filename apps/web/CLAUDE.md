# apps/web — `@lerapay/web`

React Router 8 frontend application for the LeraPay monorepo. This file is scoped to this package; for monorepo-wide conventions (tooling, catalogs, workspace layout) see the root [`CLAUDE.md`](../../CLAUDE.md).

## Stack

- **Framework**: React Router 8 in **framework mode** (`react-router` 8.3.0), SSR enabled (`react-router.config.ts` sets `ssr: true`).
- **UI**: React 19 (`react`/`react-dom` 19.2.8).
- **Language**: TypeScript 7.0.2 (`catalog:frontend`).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` (no separate config file — Tailwind is driven by the Vite plugin).
- **UI Library**: shadcn-style components (configured via `components.json`), built on top of Tailwind v4.
- **Bundler**: Vite 8 (`vite` 8.2.1) with `@vitejs/plugin-react` and the `reactRouter()` plugin.
- **Lint/Format**: `oxlint` + `oxfmt` (not ESLint/Prettier), per the monorepo standard.

## Key conventions (established in `app/`)

These reflect how the scaffold is wired — match them when adding code:

- **Routes are declared in `app/routes.ts`** using the `@react-router/dev/routes` helpers (e.g. `index('routes/home.tsx')`, `route(...)`). Add new routes there rather than via file-based routing magic — this is *config mode*, not flat-file routing.
- **Route modules live in `app/routes/*.tsx`** (e.g. `app/routes/home.tsx`). Each exports `meta`, `loader`, `action`, and/or a default React component.
- **Use generated route types.** After `react-router typegen`, each route gets a `./+types/<name>` module (e.g. `import type { Route } from './+types/home'`). Use `Route.ComponentProps`, `Route.LoaderArgs`, `Route.MetaArgs`, etc. — never hand-write prop/loader typing.
- **`root.tsx` is the root layout.** It renders `<html>`, `<Links/>`, `<Meta/>`, `<Outlet/>`, `<ScrollRestoration/>`, and `<Scripts/>`. Keep global `meta`/`links` here; per-route meta belongs in the route module.
- **Tailwind v4**: styles live in `app/app.css` and are imported in `root.tsx` via `import stylesheet from './app.css?url'` then exposed through the `links` export. There is no `tailwind.config` file — configure Tailwind through CSS (`@theme`, `@import "tailwindcss"`) instead.
- **`verbatimModuleSyntax: true`** in `tsconfig.json` — type-only imports **must** use `import type`. This is enforced by the build.
- **SSR is on**: loaders/actions run on the server. Mark client-only code with `.client.tsx` and server-only code with `.server.tsx` when needed.

## Project layout

```
apps/web
├── react-router.config.ts   # framework mode, ssr: true
├── vite.config.ts           # tailwindcss() + reactRouter() plugins
├── tsconfig.json            # strict, verbatimModuleSyntax, Bundler resolution
├── app
│   ├── root.tsx             # root HTML layout + global links/meta
│   ├── app.css              # Tailwind v4 entry stylesheet
│   ├── env.d.ts             # vite/client type reference
│   ├── routes.ts            # route config (config mode)
│   └── routes
│       └── home.tsx         # sample index route
└── build/                   # compiled output (gitignored)
```

The app currently has a single `home` route. When adding a domain route, create `app/routes/<name>.tsx` and register it in `app/routes.ts`.

## shadcn UI Library

The project uses **shadcn-style components** configured via `components.json`. This setup provides:

- **Component registry**: reusable UI components (buttons, inputs, cards, etc.)
- **Tailwind v4 integration**: components use Tailwind's CSS variables and `@theme` directives
- **TypeScript-first**: all components are typed with React 19

### Adding Components

Use the shadcn CLI to add components:

```bash
pnpm dlx shadcn@latest add <component-name>
```

This will:
1. Add the component to `app/components/`
2. Register any dependencies in `package.json`
3. Update `components.json` if needed

### Component Conventions

- Components live in `app/components/` (not `src/`)
- Use Tailwind v4 utility classes — no custom CSS modules
- Follow React 19 conventions (no legacy lifecycle methods)
- Export typed props using `React.ComponentPropsWithoutRef` when extending native elements

## Environment

No `.env` is required for local dev. To talk to the API, target `http://localhost:3000/api` (or read it from an env var / `app/env.d.ts` augmentation). Vite dev server runs on `http://localhost:5173`.

## Commands

Run from this package via `pnpm --filter @lerapay/web <script>` (or `turbo run <script> --filter @lerapay/web`):

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `react-router dev` | Start dev server (Vite, HMR) |
| `build` | `react-router build` | Production build to `build/` |
| `start` | `react-router-serve ./build/server/index.js` | Serve the built SSR app |
| `typecheck` | `react-router typegen && tsc` | Generate route types, then type-check |
| `lint` | `oxlint .` | Lint with oxlint |
| `lint:fix` | `oxlint . --fix` | Auto-fix lint issues |
| `format` | `oxfmt .` | Format with oxfmt |
| `format:check` | `oxfmt --check .` | Verify formatting |

`typecheck` runs `react-router typegen` first so the `./+types/*` route modules exist before `tsc` runs.

## Service endpoints

- Web app: `http://localhost:5173`
