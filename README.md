# GALA Games — NG Panda Games

Enterprise architecture blueprint for a **web-first, mobile-optimized, cyberpunk panda casino ecosystem** with real-time jackpots, financial-grade backend services, and DevSecOps hardening.

## 1) Product Pillars

- Luxury neon casino presentation (Cyber Panda visual DNA)
- Ethical high-engagement loops (quests, social, progression)
- Realtime multiplayer jackpot network (global sync)
- Financial-grade wallet/payments/compliance systems
- Enterprise operations (LiveOps, observability, CI/CD, security)

## 2) Platform Composition

### Player Surface
- Next.js + React + Tailwind + Framer Motion web app
- PWA install support (Android-first, iOS optimized)
- App-shell architecture with offline cache and lazy asset streaming
- 60 FPS mobile UX, thumb-zone controls, motion reduction mode, accessibility baseline

### Admin + LiveOps
- Admin dashboard for RTP, jackpots, users, fraud, withdrawals, campaigns
- LiveOps tools: dynamic events, missions, battle pass, feature flags, rollback controls
- Analytics dashboards for DAU/MAU, ARPU, retention, funnels, whales/churn

### Core Services (NestJS microservices)
- Auth (JWT rotation, OAuth, MFA)
- Wallet Ledger (double-entry, balances, reconciliation)
- Payments (Xendit, PayMongo, Stripe/PayPal rails)
- Jackpot Engine (Mini/Minor/Major/Grand progressive tiers)
- Multiplayer/Realtime (Socket.IO + Redis Pub/Sub + presence + matchmaking)
- Rewards/VIP/Referral economy
- Fraud AI + Risk Scoring + Withdrawal decisioning
- Notifications orchestration (push, campaigns, targeting)
- Moderation + social/chat controls

## 3) Realtime Jackpot + Multiplayer Network

- Distributed Socket.IO nodes (regional shards)
- Redis Pub/Sub fanout for jackpot increments, winner feed, clan/tournament updates
- Presence service for online state and lobby social feed
- Event synchronization for:
  - Multiplayer Jackpot Arena
  - Clan Jackpot Wars / Raids
  - Panda Arena PvP
  - Panda Royale (50-player survival jackpot mode)

## 4) Game & Engagement Systems

### Core Modes
1. Panda Fortune Slots
2. Panda Crash
3. Panda Dice
4. Panda Treasure
5. Panda Spin Wheel
6. Dragon Riches
7. Golden Koi Jackpot
8. Multiplayer Jackpot Arena
9. Clan Jackpot Wars
10. VIP High Roller Tables

### Expansion Modes
- Panda Royale
- Fortune Tower
- Lucky Bamboo Merge
- Panda Arena PvP
- Clan Jackpot Raids
- Fortune Rush seasonal events
- AI Challenge Rooms

### Progression & Retention
- Missions/quests + achievements
- Battle pass + seasonal content scheduler
- VIP levels + cashback tiers
- Referral ladders + invite bonuses
- Personalized offers, smart notifications, recommendation engine

## 5) Responsible Gaming, Compliance, and Integrity

- Provably fair RNG architecture and auditable game session seeds
- RTP profile management with safeguards and admin controls
- Session reminders, deposit limits, cooldown timers, self-exclusion
- AML monitoring + KYC workflows + immutable audit logs
- Strict prohibition of deceptive RTP or fake-winner simulation

## 6) Payments, Wallet, and Financial Security

### Supported Wallet Rails
- GCash, Maya, GrabPay, PayPal, Stripe, Apple Pay, Google Pay

### Processing + Controls
- Instant deposits, withdrawal workflow with risk gates
- Transaction ledger, history, promo codes, cashback automation
- Withdrawal flow:
  1. User request
  2. AI fraud scan
  3. Risk scoring
  4. Admin approval
  5. Payment release

### Fraud Intelligence
- Device fingerprinting
- Velocity and abuse checks
- Multi-account detection
- VPN/proxy geo-risk signals
- Behavioral anomaly models

## 7) Security & DevSecOps

- WAF + Cloudflare anti-DDoS
- API rate limiting and bot detection
- Session fingerprinting and device trust scoring
- Secret vault integration
- GitHub Actions CI/CD with environment separation
- Blue/green + canary release support
- Automated rollback runbooks

## 8) Infra, Scaling, and Observability

- Dockerized services, Kubernetes orchestration
- Auto-scaling service pools and regional routing
- CDN optimization + edge caching + asset preloading
- OpenTelemetry distributed tracing
- Prometheus metrics + Grafana dashboards
- Sentry error tracking
- Realtime alerting to Discord/Telegram admin channels

## 9) Data Model Coverage

### Core Models
- Users
- Wallets
- Transactions
- Jackpots
- GameSessions
- Rewards
- VIPLevels
- Referrals
- FraudFlags
- AdminLogs
- Promotions
- Withdrawals
- Deposits
- Leaderboards

### Expanded Enterprise Models
- Sessions
- WalletLedger
- RTPProfiles
- FraudSignals
- Notifications
- Clans
- ClanWars
- Missions
- Achievements
- BattlePass
- Tournaments
- DeviceFingerprints
- KYCProfiles
- AuditEvents
- LiveOpsConfigs
- PromotionRules
- AnalyticsEvents
- RealtimePresence
- AIRecommendations

## 10) Monorepo/Org Target Repositories

- gala-games-ui
- gala-games-backend
- gala-games-admin
- gala-games-payments
- gala-games-wallet
- gala-games-liveops
- gala-games-ai-fraud
- gala-games-assets
- gala-games-devops
- gala-games-docs

## 11) Production Folder Structure (reference)

```text
platform/
  apps/
    web-ui/
    admin-dashboard/
  services/
    auth/
    wallet-ledger/
    payments/
    jackpot-engine/
    realtime-gateway/
    matchmaking/
    presence/
    rewards-vip/
    referral/
    notifications/
    fraud-ai/
    moderation/
    analytics/
    liveops/
  packages/
    ui-system/
    game-sdk/
    rng-core/
    telemetry/
    security/
    config/
  infra/
    docker/
    kubernetes/
    terraform/
    cloudflare/
    github-actions/
  assets/
    mascot/
    vfx/
    audio/
    seasonal/
```

## 12) Experience Target

**Luxury Cyberpunk Panda Universe** + **Realtime Social Jackpot Metaverse** + **AAA Mobile Casino Entertainment** + **Enterprise Financial Infrastructure** + **TikTok Viral UX Engine** + **Cloud-Native Gaming Platform**.
