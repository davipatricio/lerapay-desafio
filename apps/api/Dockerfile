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
# Stage 3: Monorepo Compilation & Production Pruning
# -----------------------------------------------------------------------------
FROM dependencies AS builder
COPY packages/gateway-sdk ./packages/gateway-sdk
COPY apps/api ./apps/api

# Build SDK package dependency first, then NestJS API
RUN pnpm --filter @lerapay/gateway-sdk build
RUN pnpm --filter @lerapay/api build

# Prune into standalone isolated production distribution
RUN pnpm --filter @lerapay/api --prod --legacy deploy /prod/api
RUN cp -r /app/apps/api/dist /prod/api/dist
RUN cp /app/apps/api/docker-entrypoint.sh /prod/api/docker-entrypoint.sh && chmod +x /prod/api/docker-entrypoint.sh

# -----------------------------------------------------------------------------
# Stage 4: Minimal Production Runner
# -----------------------------------------------------------------------------
FROM node:26-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl tini
ENV NODE_ENV=production
ENV PORT=3000

# Copy isolated production bundle with non-root ownership
COPY --chown=node:node --from=builder /prod/api ./

USER node

EXPOSE 3000

# Healthcheck targeting OpenAPI/Swagger docs endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/docs || exit 1

ENTRYPOINT ["/sbin/tini", "--", "./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
