# ── Base ────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable

# ── Install stage ──────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/utils/package.json ./packages/utils/
COPY packages/game-sdk/package.json ./packages/game-sdk/
COPY services/game/package.json ./services/game/
RUN pnpm install --frozen-lockfile

# ── Build stage ─────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @panda-ng/types run build && \
    pnpm --filter @panda-ng/config run build && \
    pnpm --filter @panda-ng/utils run build && \
    pnpm --filter @panda-ng/game-sdk run build && \
    pnpm --filter @panda-ng/game-service run build

# ── Deploy stage ─────────────────────────────────────────────────────────────────
FROM base AS deployer
WORKDIR /app
COPY --from=builder /app .
RUN pnpm deploy --filter=@panda-ng/game-service --prod /deploy

# ── Production stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY --from=deployer --chown=nestjs:nodejs /deploy/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/game/dist ./dist
USER nestjs
EXPOSE 3009
CMD ["node", "dist/main.js"]
