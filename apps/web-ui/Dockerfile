# ── Base ────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable

# ── Install stage ────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/web-ui/package.json ./apps/web-ui/
RUN pnpm install --frozen-lockfile

# ── Build stage ──────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @panda-ng/types run build && \
    pnpm --filter @panda-ng/utils run build && \
    pnpm --filter @panda-ng/web-ui run build

# ── Production stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
# next build --standalone output bundles everything needed under .next/standalone
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-ui/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-ui/.next/static ./apps/web-ui/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-ui/public ./apps/web-ui/public
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web-ui/server.js"]
