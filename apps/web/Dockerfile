# syntax=docker/dockerfile:1

# -----------------------------------------------------------------------------
# Stage 1: Base Runtime & Package Manager Setup
# -----------------------------------------------------------------------------
FROM node:26-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat tini curl
RUN npm install -g pnpm@11.21.0
WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 2: Workspace Manifests & Dependency Installation (Layer Caching)
# -----------------------------------------------------------------------------
FROM base AS dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/gateway-sdk/package.json ./packages/gateway-sdk/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 3: Web Application Compilation & Production Pruning
# -----------------------------------------------------------------------------
FROM dependencies AS builder
COPY apps/web ./apps/web

# Optional build argument for embedding public API base URL at build time if needed
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:3000/api}

# Build React Router 8 SSR application (client + server bundles)
RUN pnpm --filter @lerapay/web build

# Prune into standalone isolated production distribution
RUN pnpm --filter @lerapay/web --prod --legacy deploy /prod/web
RUN cp -r /app/apps/web/build /prod/web/build

# -----------------------------------------------------------------------------
# Stage 4: Minimal Production Runner
# -----------------------------------------------------------------------------
FROM node:26-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl tini
ENV NODE_ENV=production
ENV PORT=5173

# Copy isolated production bundle with non-root ownership
COPY --chown=node:node --from=builder /prod/web ./

USER node

EXPOSE 5173

# Healthcheck targeting root SSR document endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5173/ || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "node_modules/@react-router/serve/dist/cli.js", "./build/server/index.js"]
