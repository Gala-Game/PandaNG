# PandaNG Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose 2.20+
- Node.js 20+ and pnpm 9+
- PostgreSQL 16+ (or use Docker Compose)
- Redis 7+ (or use Docker Compose)

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values.

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `DATABASE_DIRECT_URL` | Direct Postgres URL (for migrations) | ✅ |
| `REDIS_URL` | Redis connection URL | ✅ |
| `JWT_SECRET` | 32+ char random string for JWT signing | ✅ |
| `JWT_REFRESH_SECRET` | 32+ char random string for refresh tokens | ✅ |
| `PAYMONGO_SECRET_KEY` | PayMongo live secret key (GCash/Maya/GrabPay) | ✅ |
| `PAYMONGO_WEBHOOK_SECRET` | PayMongo webhook signing secret | ✅ |
| `STRIPE_SECRET_KEY` | Stripe live secret key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret | ✅ |
| `XENDIT_SECRET_KEY` | Xendit production key | ✅ |
| `XENDIT_CALLBACK_TOKEN` | Xendit callback token | ✅ |
| `CORS_ORIGINS` | Comma-separated allowed origins | ✅ |

---

## Local Development with Docker Compose

```bash
# 1. Clone and install dependencies
git clone https://github.com/Gala-Game/PandaNG.git
cd PandaNG
npm install -g pnpm@9
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 3. Generate Prisma client
pnpm prisma generate

# 4. Start infrastructure (Postgres + Redis)
docker compose up postgres redis -d

# 5. Run database migrations
pnpm prisma migrate deploy

# 6. Seed demo data
pnpm db:seed

# 7. Start all services in dev mode
pnpm dev
```

### Service URLs (dev)

| Service | URL |
|---------|-----|
| Web UI | http://localhost:3000 |
| Auth API | http://localhost:3001/api/docs |
| Wallet API | http://localhost:3002/api/docs |
| Jackpot API | http://localhost:3003/api/docs |
| Realtime WS | ws://localhost:3004 |
| Rewards API | http://localhost:3005/api/docs |
| Notifications | http://localhost:3006/api/docs |
| Fraud API | http://localhost:3007/api/docs |
| Admin API | http://localhost:3008/api/docs |
| Game API | http://localhost:3009/api/docs |
| Admin Dashboard | http://localhost:3010 |

---

## Full Docker Compose (all services)

```bash
# Build and start everything
docker compose up --build -d

# View logs
docker compose logs -f game wallet auth

# Stop
docker compose down
```

---

## Production Deployment (Kubernetes)

### 1. Prerequisites

- kubectl configured with cluster access
- Helm 3+
- cert-manager installed
- NGINX Ingress Controller installed

### 2. Install cert-manager (if not present)

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml
```

### 3. Create ClusterIssuer for Let's Encrypt

```bash
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: devops@pandang.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

### 4. Deploy secrets

> ⚠️ **Never commit real secrets to git.** Use External Secrets Operator or SOPS.

```bash
# Edit k8s/01-secrets.yaml with real values or use External Secrets
kubectl apply -f k8s/01-secrets.yaml
```

### 5. Deploy application

```bash
# Apply all manifests in order
kubectl apply -f k8s/00-namespace-configmap.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/ingress.yaml

# Verify rollout
kubectl rollout status deployment/auth -n pandang
kubectl rollout status deployment/wallet -n pandang
kubectl rollout status deployment/game -n pandang
```

### 6. Run migrations in cluster

```bash
kubectl run prisma-migrate \
  --image=ghcr.io/gala-game/pandang-auth:latest \
  --restart=Never \
  --env="DATABASE_URL=$(kubectl get secret pandang-secrets -n pandang -o jsonpath='{.data.DATABASE_URL}' | base64 -d)" \
  --command -- sh -c "npx prisma migrate deploy"
  
# Clean up
kubectl delete pod prisma-migrate -n pandang
```

---

## CI/CD

The repository includes three GitHub Actions workflows:

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `ci.yml` | PRs to main/develop | Lint, type-check, test, Docker build |
| `deploy.yml` | Push to main | Build + push images to GHCR |
| `security-scan.yml` | Push to main, weekly | Trivy container scan, npm audit |

### Required GitHub Secrets

```
GITHUB_TOKEN          # Auto-provided by GitHub Actions
```

---

## Database Migrations

```bash
# Create a new migration
pnpm prisma migrate dev --name <migration-name>

# Apply migrations (production)
pnpm prisma migrate deploy

# Reset database (DEV ONLY)
pnpm prisma migrate reset
```

---

## Security Checklist

Before going live:

- [ ] Rotate JWT_SECRET to a 64+ char cryptographic random value
- [ ] Enable Redis AUTH password
- [ ] Configure Postgres SSL (`?sslmode=require`)
- [ ] Set up WAF rules in cloud provider
- [ ] Enable PAGCOR-required IP allowlisting for admin dashboard
- [ ] Configure rate limiting on ingress (10 req/s per IP for game API)
- [ ] Verify PayMongo/Stripe webhook signatures are enforced
- [ ] Run `pnpm audit --audit-level=high` and resolve all findings
- [ ] Enable Cloudflare DDoS protection on public endpoints

---

## Monitoring

Add these Grafana dashboards after deploying observability stack:

- RPS per service (game, wallet, auth)
- Wallet balance delta (deposit/withdrawal rate)
- Game sessions per minute
- Fraud signal rate
- Jackpot growth curve
