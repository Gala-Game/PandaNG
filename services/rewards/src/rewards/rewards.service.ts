import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VIPLevel } from '@panda-ng/types';

// VIP thresholds in XP points
const VIP_THRESHOLDS: Record<VIPLevel, number> = {
  [VIPLevel.BRONZE]: 0,
  [VIPLevel.SILVER]: 1000,
  [VIPLevel.GOLD]: 5000,
  [VIPLevel.PLATINUM]: 20000,
  [VIPLevel.DIAMOND]: 100000,
  [VIPLevel.PANDA_ELITE]: 500000,
};

// Cashback rates per VIP level (in basis points, 1 bps = 0.01%)
const CASHBACK_RATES: Record<VIPLevel, number> = {
  [VIPLevel.BRONZE]: 50,       // 0.5%
  [VIPLevel.SILVER]: 100,      // 1.0%
  [VIPLevel.GOLD]: 150,        // 1.5%
  [VIPLevel.PLATINUM]: 200,    // 2.0%
  [VIPLevel.DIAMOND]: 300,     // 3.0%
  [VIPLevel.PANDA_ELITE]: 500, // 5.0%
};

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getVIPStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        vipLevel: true,
        vipXp: true,
        wallet: { select: { totalWageredInCents: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const currentLevel = user.vipLevel as VIPLevel;
    const currentXp = Number(user.vipXp ?? 0);

    const levels = Object.values(VIPLevel);
    const currentIndex = levels.indexOf(currentLevel);
    const nextLevel = levels[currentIndex + 1] as VIPLevel | undefined;
    const nextThreshold = nextLevel ? VIP_THRESHOLDS[nextLevel] : null;
    const cashbackRate = CASHBACK_RATES[currentLevel];

    return {
      currentLevel,
      currentXp,
      nextLevel: nextLevel ?? null,
      nextThreshold,
      xpToNextLevel: nextThreshold !== null ? nextThreshold - currentXp : null,
      cashbackRate: cashbackRate / 10000,
      totalWageredInCents: user.wallet?.totalWageredInCents?.toString() ?? '0',
    };
  }

  async getMissions(userId: string) {
    const now = new Date();
    const missions = await this.prisma.userMission.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: { mission: true },
      orderBy: { mission: { sortOrder: 'asc' } },
    });

    const startedMissionIds = missions.map((m) => m.missionId);
    const availableMissions = await this.prisma.mission.findMany({
      where: {
        isActive: true,
        id: { notIn: startedMissionIds },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    return { active: missions, available: availableMissions };
  }

  async claimMission(userId: string, missionId: string) {
    const userMission = await this.prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId } },
      include: { mission: true },
    });

    if (!userMission) throw new NotFoundException('Mission not found');
    if (userMission.status === 'CLAIMED') {
      throw new BadRequestException('Mission reward already claimed');
    }
    if (userMission.status !== 'COMPLETED') {
      throw new BadRequestException('Mission is not completed yet');
    }

    const updated = await this.prisma.userMission.update({
      where: { userId_missionId: { userId, missionId } },
      data: { status: 'CLAIMED', claimedAt: new Date() },
    });

    this.logger.log(
      `Mission claimed: userId=${userId} missionId=${missionId} reward=${userMission.mission.rewardAmount}`,
    );

    return {
      reward: userMission.mission.rewardType,
      amount: userMission.mission.rewardAmount,
      userMission: updated,
    };
  }

  async getAchievements(userId: string) {
    const [unlocked, all] = await Promise.all([
      this.prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      }),
      this.prisma.achievement.findMany({
        where: { isSecret: false },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const unlockedIds = new Set(unlocked.map((u) => u.achievementId));
    return {
      unlocked,
      locked: all.filter((a) => !unlockedIds.has(a.id)),
      total: all.length,
      completionRate: all.length > 0 ? Math.round((unlockedIds.size / all.length) * 10000) / 100 : 0,
    };
  }

  async getBattlePass(userId: string) {
    const now = new Date();
    const activeBattlePass = await this.prisma.battlePass.findFirst({
      where: { startDate: { lte: now }, endDate: { gte: now } },
    });

    if (!activeBattlePass) return { active: null, userProgress: null };

    const userProgress = await this.prisma.userBattlePass.findUnique({
      where: { userId_battlePassId: { userId, battlePassId: activeBattlePass.id } },
    });

    return { active: activeBattlePass, userProgress };
  }

  async claimCashback(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        vipLevel: true,
        wallet: { select: { totalWageredInCents: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const vipLevel = user.vipLevel as VIPLevel;
    const cashbackRateBps = CASHBACK_RATES[vipLevel];
    const totalWagered = user.wallet?.totalWageredInCents ?? 0n;

    // Integer-safe cashback calculation in cents
    const cashbackInCents = (BigInt(totalWagered) * BigInt(cashbackRateBps)) / 10000n;

    if (cashbackInCents <= 0n) {
      throw new BadRequestException('No cashback available');
    }

    // TODO: Credit cashback to wallet via wallet service (inter-service call)
    this.logger.log(
      `Cashback claimed: userId=${userId} amount=${cashbackInCents} level=${vipLevel}`,
    );

    return {
      cashbackInCents: cashbackInCents.toString(),
      vipLevel,
      rate: cashbackRateBps / 10000,
    };
  }
}
