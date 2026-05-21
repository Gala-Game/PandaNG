# ── Base ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable

# ── Install stage ─────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/admin-dashboard/package.json ./apps/admin-dashboard/
RUN pnpm install --frozen-lockfile

# ── Build stage ───────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @panda-ng/types run build && \
    pnpm --filter @panda-ng/utils run build && \
    pnpm --filter @panda-ng/admin-dashboard run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-dashboard/.next/static ./apps/admin-dashboard/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-dashboard/public ./apps/admin-dashboard/public
USER nextjs
EXPOSE 3010
ENV PORT=3010
CMD ["node", "apps/admin-dashboard/server.js"]
