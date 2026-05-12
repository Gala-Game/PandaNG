import { PrismaClient, JackpotTier, GameType, UserRole, UserStatus, KYCStatus, VIPLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🐼 Seeding PandaNG database...');

  // ── Jackpots ──────────────────────────────────────────────────────────────
  const jackpots = [
    { tier: JackpotTier.MINI,  name: 'Mini Panda',          seed: 50_000n,     rate: 0.001 },
    { tier: JackpotTier.MINOR, name: 'Bamboo Jackpot',      seed: 500_000n,    rate: 0.002 },
    { tier: JackpotTier.MAJOR, name: 'Golden Panda',        seed: 5_000_000n,  rate: 0.003 },
    { tier: JackpotTier.GRAND, name: 'Grand Panda Supreme', seed: 50_000_000n, rate: 0.005 },
  ];
  for (const j of jackpots) {
    await prisma.jackpot.upsert({
      where: { tier: j.tier },
      create: {
        tier: j.tier,
        name: j.name,
        seedAmountInCents: j.seed,
        currentAmountInCents: j.seed,
        contributionRate: j.rate,
        maxWinMultiplier: 1000,
        isActive: true,
      },
      update: {},
    });
  }
  console.log('✅ Jackpots seeded');

  // ── RTP Profiles ──────────────────────────────────────────────────────────
  const rtpProfiles = [
    { gameType: GameType.SLOTS,       name: 'Standard',      rtp: 0.96,   variance: 'medium', min: 10n,   max: 1_000_000n  },
    { gameType: GameType.SLOTS,       name: 'High Variance', rtp: 0.94,   variance: 'high',   min: 100n,  max: 5_000_000n  },
    { gameType: GameType.CRASH,       name: 'Standard',      rtp: 0.96,   variance: 'high',   min: 10n,   max: 1_000_000n  },
    { gameType: GameType.DRAGON_DICE, name: 'Standard',      rtp: 0.98,   variance: 'low',    min: 10n,   max: 500_000n    },
    { gameType: GameType.PANDA_SPIN,  name: 'Standard',      rtp: 0.95,   variance: 'medium', min: 10n,   max: 1_000_000n  },
    { gameType: GameType.BAMBOO_BLAST,name: 'Standard',      rtp: 0.96,   variance: 'medium', min: 10n,   max: 1_000_000n  },
    { gameType: GameType.SCRATCH_CARD,name: 'Standard',      rtp: 0.90,   variance: 'low',    min: 500n,  max: 500_000n    },
    { gameType: GameType.ROULETTE,    name: 'Standard',      rtp: 0.973,  variance: 'medium', min: 10n,   max: 2_000_000n  },
  ];
  for (const p of rtpProfiles) {
    await prisma.rTPProfile.upsert({
      where: { gameType_name: { gameType: p.gameType, name: p.name } },
      create: {
        gameType: p.gameType,
        name: p.name,
        rtp: p.rtp,
        variance: p.variance,
        minBetInCents: p.min,
        maxBetInCents: p.max,
        isActive: true,
      },
      update: {},
    });
  }
  console.log('✅ RTP Profiles seeded');

  // ── Admin user ────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@PandaNG2024!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@pandang.com' },
    create: {
      email: 'admin@pandang.com',
      username: 'pandang_admin',
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      kycStatus: KYCStatus.VERIFIED,
      vipLevel: VIPLevel.PANDA_ELITE,
      referralCode: 'ADMIN001',
      wallet: { create: { balanceInCents: 0n, currency: 'PHP' } },
    },
    update: {},
  });
  console.log('✅ Admin user seeded — admin@pandang.com (see .env.example for seed credentials)');

  // ── Demo player ───────────────────────────────────────────────────────────
  const playerHash = await bcrypt.hash('Player@PandaNG2024!', 12);
  await prisma.user.upsert({
    where: { email: 'player@pandang.com' },
    create: {
      email: 'player@pandang.com',
      username: 'lucky_panda',
      passwordHash: playerHash,
      role: UserRole.PLAYER,
      status: UserStatus.ACTIVE,
      kycStatus: KYCStatus.VERIFIED,
      vipLevel: VIPLevel.GOLD,
      referralCode: 'LUCKY001',
      wallet: {
        create: {
          balanceInCents: 1_000_000n,       // ₱10,000 demo balance
          bonusBalanceInCents: 50_000n,     // ₱500 bonus
          currency: 'PHP',
        },
      },
    },
    update: {},
  });
  console.log('✅ Demo player seeded  — player@pandang.com (see .env.example for seed credentials)');

  // ── LiveOps defaults ──────────────────────────────────────────────────────
  const liveOps = [
    { key: 'maintenance_mode',           value: false,   description: 'Enable maintenance mode globally' },
    { key: 'jackpot_contributions_enabled', value: true, description: 'Allow bet contributions to jackpots' },
    { key: 'new_player_bonus_enabled',   value: true,    description: 'Welcome bonus for new registrations' },
    { key: 'welcome_bonus_cents',        value: 50000,   description: 'Welcome bonus amount (₱500)' },
    { key: 'max_session_hours',          value: 4,       description: 'Session reminder interval in hours' },
  ];
  for (const c of liveOps) {
    await prisma.liveOpsConfig.upsert({
      where: { key_environment: { key: c.key, environment: 'production' } },
      create: { key: c.key, value: c.value, environment: 'production', description: c.description, createdBy: 'system' },
      update: {},
    });
  }
  console.log('✅ LiveOps config seeded');

  // ── Sample missions ───────────────────────────────────────────────────────
  const missions = [
    { name: 'First Spin!',     description: 'Play your first slot spin',         type: 'TUTORIAL',     requirements: { action: 'bet', gameType: 'SLOTS', count: 1 },           rewardType: 'BONUS_CASH', rewardAmount: 10_000n },
    { name: 'Daily Grinder',   description: 'Place 5 bets today',                type: 'DAILY',        requirements: { action: 'bet', count: 5 },                               rewardType: 'XP',         rewardAmount: 100n    },
    { name: 'High Roller',     description: 'Wager ₱1,000 in a single day',      type: 'DAILY',        requirements: { action: 'wager', totalInCents: 100_000 },                rewardType: 'BONUS_CASH', rewardAmount: 20_000n },
    { name: 'Crash Survivor',  description: 'Cash out at 2× or higher 3 times',  type: 'WEEKLY',       requirements: { action: 'crash_cashout', minMultiplier: 2.0, count: 3 }, rewardType: 'BONUS_CASH', rewardAmount: 50_000n },
    { name: 'Lucky Streak',    description: 'Win 3 games in a row',              type: 'ACHIEVEMENT',  requirements: { action: 'win_streak', count: 3 },                        rewardType: 'XP',         rewardAmount: 500n    },
  ] as const;
  for (const m of missions) {
    const existing = await prisma.mission.findFirst({ where: { name: m.name } });
    if (!existing) {
      await prisma.mission.create({
        data: {
          name: m.name,
          description: m.description,
          type: m.type,
          requirements: m.requirements,
          rewardType: m.rewardType,
          rewardAmount: m.rewardAmount,
          isActive: true,
        },
      });
    }
  }
  console.log('✅ Missions seeded');

  console.log('\n🐼 PandaNG seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
