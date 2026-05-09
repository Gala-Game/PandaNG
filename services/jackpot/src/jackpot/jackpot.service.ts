import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { JackpotGateway } from './jackpot.gateway';
import { RedisService } from './redis.service';
import { ContributeDto } from './dto/contribute.dto';
import type { JackpotTickPayload, JackpotWinPayload } from '@panda-ng/types';
import { SocketEvents } from '@panda-ng/types';

@Injectable()
export class JackpotService {
  private readonly logger = new Logger(JackpotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: JackpotGateway,
    private readonly redis: RedisService,
  ) {}

  async getAllJackpots() {
    const jackpots = await this.prisma.jackpot.findMany({
      where: { isActive: true },
      orderBy: { tier: 'asc' },
    });
    // Serialize BigInt fields to strings for safe JSON response
    return jackpots.map((j) => ({
      ...j,
      currentAmountInCents: j.currentAmountInCents.toString(),
      seedAmountInCents: j.seedAmountInCents.toString(),
    }));
  }

  async getJackpot(id: string) {
    const jackpot = await this.prisma.jackpot.findUnique({ where: { id } });
    if (!jackpot) throw new NotFoundException(`Jackpot ${id} not found`);
    // Serialize BigInt fields to strings for safe JSON response
    return {
      ...jackpot,
      currentAmountInCents: jackpot.currentAmountInCents.toString(),
      seedAmountInCents: jackpot.seedAmountInCents.toString(),
    };
  }

  async contributeToJackpot(jackpotId: string, dto: ContributeDto) {
    const jackpot = await this.prisma.jackpot.findUnique({
      where: { id: jackpotId },
      select: { id: true, isActive: true, contributionRate: true },
    });
    if (!jackpot) throw new NotFoundException('Jackpot not found');
    if (!jackpot.isActive) throw new BadRequestException('Jackpot is not active');

    const betAmountInCents = BigInt(dto.betAmountInCents);
    // contributionRate is a decimal (e.g. 0.01 for 1%). Use integer math: rate * 10000 bps.
    const contributionRate = Number(jackpot.contributionRate);
    const contributionInCents =
      (betAmountInCents * BigInt(Math.round(contributionRate * 10000))) / 10000n;

    if (contributionInCents <= 0n) return { contributed: '0' };

    const updated = await this.prisma.jackpot.update({
      where: { id: jackpotId },
      data: { currentAmountInCents: { increment: contributionInCents } },
      select: { id: true, tier: true, currentAmountInCents: true },
    });

    return {
      contributed: contributionInCents.toString(),
      currentAmount: updated.currentAmountInCents.toString(),
    };
  }

  async triggerWin(jackpotId: string, userId: string, gameSessionId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const jackpot = await tx.jackpot.findUnique({ where: { id: jackpotId } });
      if (!jackpot) throw new NotFoundException('Jackpot not found');
      if (!jackpot.isActive) throw new BadRequestException('Jackpot is not active');

      const winAmount = jackpot.currentAmountInCents;

      const win = await tx.jackpotWin.create({
        data: {
          jackpotId,
          userId,
          amountInCents: winAmount,
          gameSessionId,
          confirmedAt: new Date(),
        },
      });

      // Reset jackpot to seed amount
      await tx.jackpot.update({
        where: { id: jackpotId },
        data: {
          currentAmountInCents: jackpot.seedAmountInCents,
          lastWonAt: new Date(),
          lastWonByUserId: userId,
        },
      });

      const winner = await tx.user.findUnique({
        where: { id: userId },
        select: { username: true, avatarUrl: true },
      });

      const winPayload: JackpotWinPayload = {
        win: {
          ...win,
          username: winner?.username ?? 'Lucky Panda',
          amountInCents: winAmount.toString(),
          tier: jackpot.tier,
        },
        newSeedAmountInCents: jackpot.seedAmountInCents.toString(),
        tier: jackpot.tier,
      };

      this.gateway.broadcastJackpotWin(winPayload);

      await this.redis.publish(
        'jackpot:win',
        JSON.stringify({ ...winPayload, jackpotId, userId, winId: win.id }),
      );

      this.logger.log(
        `JACKPOT WIN: tier=${jackpot.tier} amount=${winAmount} userId=${userId} winId=${win.id} triggeredBy=${adminId}`,
      );

      return { win, resetTo: jackpot.seedAmountInCents.toString() };
    });
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async broadcastTick(): Promise<void> {
    try {
      const jackpots = await this.prisma.jackpot.findMany({
        where: { isActive: true },
        select: { id: true, tier: true, currentAmountInCents: true, name: true },
        orderBy: { tier: 'asc' },
      });

      const payload: JackpotTickPayload = {
        jackpots: jackpots.map((j) => ({
          id: j.id,
          tier: j.tier,
          currentAmountInCents: j.currentAmountInCents.toString(),
          name: j.name,
        })),
        timestamp: Date.now(),
      };

      this.gateway.broadcastJackpotTick(payload);
    } catch (error) {
      this.logger.error('Failed to broadcast jackpot tick', error);
    }
  }
}
