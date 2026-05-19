/**
 * Prisma seed — demo users, jackpots, RTP profiles, missions, battle-pass season
 * Run with: pnpm prisma db seed
 */

import { PrismaClient, GameType, JackpotTier } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(plain: string): string {
  // In production this would be bcrypt/argon2; for seeding we use SHA256
  return createHash('sha256').update(plain + ':seed-salt').digest('hex');
}

async function main() {
  // Safety guard: never seed in production with hardcoded credentials
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_ALLOW_PRODUCTION) {
    throw new Error(
      'Refusing to seed in production. Set SEED_ALLOW_PRODUCTION=1 to override (dangerous).',
    );
  }

  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ??
    (process.env.NODE_ENV === 'production'
      ? (() => { throw new Error('SEED_ADMIN_PASSWORD must be set in production'); })()
      : 'Admin@PandaNG2026!');

  const playerPassword =
    process.env.SEED_PLAYER_PASSWORD ?? 'Demo@PandaNG2026!';

  console.log('🌱 Seeding database...');

  // ─── Demo Users ─────────────────────────────────────────────────────────────

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pandang.com' },
    create: {
      email: 'admin@pandang.com',
      username: 'panda_admin',
      passwordHash: hashPassword(adminPassword),
      role: 'ADMIN',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      vipLevel: 'DIAMOND',
      emailVerified: true,
      wallet: {
        create: {
          balanceInCents: 0n,
          currency: 'PHP',
        },
      },
    },
    update: {},
  });

  const playerUser = await prisma.user.upsert({
    where: { email: 'demo@pandang.com' },
    create: {
      email: 'demo@pandang.com',
      username: 'panda_demo',
      passwordHash: hashPassword(playerPassword),
      role: 'PLAYER',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      vipLevel: 'GOLD',
      emailVerified: true,
      wallet: {
        create: {
          balanceInCents: 1_000_000n, // ₱10,000 demo balance
          currency: 'PHP',
        },
      },
    },
    update: {},
  });

  console.log(`✅ Users: admin=${adminUser.id}, demo=${playerUser.id}`);

  // ─── Jackpot Tiers ──────────────────────────────────────────────────────────

  const jackpotData: Array<{
    name: string;
    tier: JackpotTier;
    seedAmountInCents: bigint;
    currentAmountInCents: bigint;
    contributionRateBps: number;
    maxContributionPerBetBps: number;
    isActive: boolean;
  }> = [
    {
      name: 'Mini',
      tier: 'MINI',
      seedAmountInCents: 100_00n,       // ₱100 seed
      currentAmountInCents: 5_000_00n,  // ₱5,000 current
      contributionRateBps: 10,          // 0.10%
      maxContributionPerBetBps: 50,
      isActive: true,
    },
    {
      name: 'Minor',
      tier: 'MINOR',
      seedAmountInCents: 1_000_00n,     // ₱1,000
      currentAmountInCents: 25_000_00n, // ₱25,000
      contributionRateBps: 20,
      maxContributionPerBetBps: 100,
      isActive: true,
    },
    {
      name: 'Major',
      tier: 'MAJOR',
      seedAmountInCents: 10_000_00n,    // ₱10,000
      currentAmountInCents: 150_000_00n, // ₱150,000
      contributionRateBps: 30,
      maxContributionPerBetBps: 200,
      isActive: true,
    },
    {
      name: 'Grand',
      tier: 'GRAND',
      seedAmountInCents: 100_000_00n,   // ₱100,000
      currentAmountInCents: 1_200_000_00n, // ₱1,200,000
      contributionRateBps: 50,
      maxContributionPerBetBps: 500,
      isActive: true,
    },
  ];

  for (const jackpot of jackpotData) {
    await prisma.jackpot.upsert({
      where: { tier: jackpot.tier },
      create: jackpot,
      update: { isActive: jackpot.isActive },
    });
  }

  console.log('✅ Jackpot tiers seeded (MINI, MINOR, MAJOR, GRAND)');

  // ─── RTP Profiles ───────────────────────────────────────────────────────────

  const rtpProfiles: Array<{
    gameType: GameType;
    name: string;
    rtp: number;
    variance: string;
    minBetInCents: bigint;
    maxBetInCents: bigint;
    isActive: boolean;
  }> = [
    // Slots
    { gameType: 'SLOTS', name: 'Slots Standard', rtp: 0.96, variance: 'medium', minBetInCents: 100n, maxBetInCents: 100_000n, isActive: true },
    { gameType: 'SLOTS', name: 'Slots High Roller', rtp: 0.97, variance: 'high', minBetInCents: 5_000n, maxBetInCents: 1_000_000n, isActive: true },
    // Crash
    { gameType: 'CRASH', name: 'Crash Standard', rtp: 0.99, variance: 'high', minBetInCents: 100n, maxBetInCents: 500_000n, isActive: true },
    // Dragon Dice
    { gameType: 'DRAGON_DICE', name: 'Dice Standard', rtp: 0.99, variance: 'low', minBetInCents: 100n, maxBetInCents: 500_000n, isActive: true },
    // Panda Spin
    { gameType: 'PANDA_SPIN', name: 'Wheel Standard', rtp: 0.97, variance: 'medium', minBetInCents: 100n, maxBetInCents: 500_000n, isActive: true },
    // Mini Game (Treasure)
    { gameType: 'MINI_GAME', name: 'Treasure Hunt Standard', rtp: 0.97, variance: 'medium', minBetInCents: 100n, maxBetInCents: 100_000n, isActive: true },
    // Scratch Card
    { gameType: 'SCRATCH_CARD', name: 'Scratch Standard', rtp: 0.95, variance: 'low', minBetInCents: 100n, maxBetInCents: 10_000n, isActive: true },
    // Roulette
    { gameType: 'ROULETTE', name: 'Roulette Standard', rtp: 0.97, variance: 'medium', minBetInCents: 100n, maxBetInCents: 200_000n, isActive: true },
    // Bamboo Blast
    { gameType: 'BAMBOO_BLAST', name: 'Bamboo Blast Standard', rtp: 0.96, variance: 'medium', minBetInCents: 100n, maxBetInCents: 100_000n, isActive: true },
  ];

  for (const profile of rtpProfiles) {
    await prisma.rTPProfile.create({ data: profile }).catch(() => null); // ignore dupes
  }

  console.log(`✅ RTP profiles seeded (${rtpProfiles.length} profiles)`);

  // ─── Sample Missions ────────────────────────────────────────────────────────

  const missions = [
    {
      name: 'First Spin',
      description: 'Complete your first slots spin',
      type: 'DAILY' as const,
      rewardXP: 100,
      rewardInCents: 0n,
      conditionType: 'SPIN_COUNT',
      conditionValue: 1,
      isActive: true,
      expiresAt: new Date(Date.now() + 86400_000),
    },
    {
      name: 'Bet Streak',
      description: 'Place 10 bets in any game',
      type: 'DAILY' as const,
      rewardXP: 500,
      rewardInCents: 100_00n, // ₱100 bonus
      conditionType: 'BET_COUNT',
      conditionValue: 10,
      isActive: true,
      expiresAt: new Date(Date.now() + 86400_000),
    },
    {
      name: 'High Roller Week',
      description: 'Wager ₱10,000 total in a week',
      type: 'WEEKLY' as const,
      rewardXP: 2000,
      rewardInCents: 500_00n, // ₱500 bonus
      conditionType: 'TOTAL_WAGER',
      conditionValue: 1_000_000, // ₱10,000 in cents
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 86400_000),
    },
  ];

  for (const mission of missions) {
    await prisma.mission.create({ data: mission }).catch(() => null);
  }

  console.log(`✅ Missions seeded (${missions.length} missions)`);

  // ─── Battle Pass Season ──────────────────────────────────────────────────────

  const season = await prisma.battlePassSeason.create({
    data: {
      name: 'Panda Dynasty Season 1',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 86400_000), // 90 days
      isActive: true,
      tiers: {
        createMany: {
          data: Array.from({ length: 50 }, (_, i) => ({
            tier: i + 1,
            xpRequired: (i + 1) * 1000,
            rewardType: i % 5 === 4 ? 'BONUS_CASH' : 'XP_BOOST',
            rewardAmountInCents: i % 5 === 4 ? BigInt((i + 1) * 500) : 0n,
            rewardDescription: i % 5 === 4 ? `₱${(i + 1) * 5} Bonus` : '1.5× XP for 1 hour',
          })),
        },
      },
    },
  }).catch(() => null);

  if (season) {
    console.log(`✅ Battle Pass Season 1 seeded with 50 tiers`);
  } else {
    console.log('⚠️  Battle Pass season already exists, skipping');
  }

  console.log('\n🐼 Seed complete!');
  console.log('Admin login: admin@pandang.com (password from SEED_ADMIN_PASSWORD env or default)');
  console.log('Demo login:  demo@pandang.com  (password from SEED_PLAYER_PASSWORD env or default)');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
