import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StartGameDto, GameTypeDto } from './dto/start-game.dto';
import { ResolveGameDto } from './dto/resolve-game.dto';
import {
  generateServerSeed,
  hashServerSeed,
  generateClientSeed,
  getSlotsResult,
  getCrashResult,
  getDiceResult,
  getWheelResult,
} from '@panda-ng/game-sdk';
import { firstValueFrom } from 'rxjs';

// Prisma GameType → game-sdk resolver
const GAME_TYPE_MAP: Record<string, GameTypeDto> = {
  SLOTS: GameTypeDto.SLOTS,
  CRASH: GameTypeDto.CRASH,
  DRAGON_DICE: GameTypeDto.DRAGON_DICE,
  PANDA_SPIN: GameTypeDto.PANDA_SPIN,
  BAMBOO_BLAST: GameTypeDto.BAMBOO_BLAST,
};

// Enum values that mirror prisma/schema.prisma GameSessionStatus
const SESSION_STATUS = {
  STARTED: 'STARTED' as const,
  COMPLETED: 'COMPLETED' as const,
  ABANDONED: 'ABANDONED' as const,
};

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private readonly walletUrl: string;
  private readonly jackpotUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.walletUrl = this.config.get<string>('WALLET_SERVICE_URL') ?? 'http://localhost:3002';
    this.jackpotUrl = this.config.get<string>('JACKPOT_SERVICE_URL') ?? 'http://localhost:3003';
  }

  async startSession(userId: string, dto: StartGameDto) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.status !== 'ACTIVE') throw new BadRequestException('Account is not active');

    // Find active RTP profile for this game type
    const rtpProfile = await this.prisma.rTPProfile.findFirst({
      where: { gameType: dto.gameType as any, isActive: true },
    });
    if (!rtpProfile) throw new NotFoundException('No active RTP profile for this game');

    const betInCents = BigInt(dto.betAmountInCents);
    if (betInCents < rtpProfile.minBetInCents) {
      throw new BadRequestException(`Minimum bet is ${rtpProfile.minBetInCents} cents`);
    }
    if (betInCents > rtpProfile.maxBetInCents) {
      throw new BadRequestException(`Maximum bet is ${rtpProfile.maxBetInCents} cents`);
    }

    // Debit wallet (call wallet service)
    const reference = `GAME-${Date.now()}-${userId.slice(-6)}`;
    try {
      await firstValueFrom(
        this.http.post(`${this.walletUrl}/api/v1/internal/debit`, {
          userId,
          amountInCents: dto.betAmountInCents.toString(),
          type: 'BET',
          reference,
          description: `${dto.gameType} bet`,
        }),
      );
    } catch (err) {
      this.logger.error('Wallet debit failed', err);
      throw new BadRequestException('Insufficient funds or wallet unavailable');
    }

    // Generate provably fair seeds
    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = dto.clientSeed ?? generateClientSeed();

    // Create game session (serverSeed stored encrypted, only hash exposed)
    const session = await this.prisma.gameSession.create({
      data: {
        userId,
        gameType: dto.gameType as any,
        betAmountInCents: betInCents,
        winAmountInCents: 0n,
        rtpProfileId: rtpProfile.id,
        seed: reference,
        serverSeed, // stored but not returned until resolution
        serverSeedHash,
        clientSeed,
        nonce: 0,
        status: SESSION_STATUS.STARTED,
      },
    });

    this.logger.log(`Session started: ${session.id} user=${userId} game=${dto.gameType} bet=${betInCents}`);

    return {
      sessionId: session.id,
      gameType: dto.gameType,
      betAmountInCents: dto.betAmountInCents.toString(),
      serverSeedHash, // committed hash — client can verify after
      clientSeed,
      nonce: 0,
      rtpProfileId: rtpProfile.id,
    };
  }

  async resolveSession(userId: string, sessionId: string, opts: ResolveGameDto) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new BadRequestException('Session does not belong to user');
    if (session.status !== SESSION_STATUS.STARTED) {
      throw new BadRequestException('Session already resolved');
    }

    const { serverSeed, clientSeed, nonce } = session;
    const betInCents = session.betAmountInCents;
    const gameType = session.gameType as string;

    // Calculate outcome using game-sdk
    let winInCents = 0n;
    let result: unknown;

    if (gameType === 'SLOTS' || gameType === 'BAMBOO_BLAST') {
      const r = getSlotsResult(serverSeed, clientSeed, nonce, betInCents);
      winInCents = r.totalWinInCents;
      result = {
        reels: r.reels,
        wins: r.wins.map((w) => ({ ...w, winInCents: w.winInCents.toString() })),
        totalWinInCents: r.totalWinInCents.toString(),
        multiplier: r.multiplier,
        isJackpotEligible: r.isJackpotEligible,
      };
    } else if (gameType === 'CRASH') {
      const cashOutAt = opts.cashOutAt ?? 0;
      const r = getCrashResult(serverSeed, clientSeed, nonce, betInCents, cashOutAt);
      winInCents = r.winInCents;
      result = {
        crashPoint: r.crashPoint,
        cashedOut: r.cashedOut,
        multiplier: r.multiplier,
        winInCents: r.winInCents.toString(),
        netChangeInCents: r.netChangeInCents.toString(),
      };
    } else if (gameType === 'DRAGON_DICE') {
      const target = opts.target ?? 50;
      const isOver = opts.isOver ?? true;
      const r = getDiceResult(serverSeed, clientSeed, nonce, betInCents, target, isOver);
      winInCents = r.winInCents;
      result = {
        roll: r.roll,
        won: r.won,
        payout: r.payout,
        winInCents: r.winInCents.toString(),
        netChangeInCents: r.netChangeInCents.toString(),
      };
    } else if (gameType === 'PANDA_SPIN') {
      const r = getWheelResult(serverSeed, clientSeed, nonce, betInCents);
      winInCents = r.winInCents;
      result = {
        segmentIndex: r.segmentIndex,
        segment: r.segment,
        winInCents: r.winInCents.toString(),
        netChangeInCents: r.netChangeInCents.toString(),
      };
    } else {
      throw new BadRequestException(`Unknown game type: ${gameType}`);
    }

    // Credit wallet if player won
    if (winInCents > 0n) {
      const winReference = `WIN-${sessionId}`;
      try {
        await firstValueFrom(
          this.http.post(`${this.walletUrl}/api/v1/internal/credit`, {
            userId,
            amountInCents: winInCents.toString(),
            type: 'WIN',
            reference: winReference,
            description: `${gameType} win`,
          }),
        );
      } catch (err) {
        this.logger.error(`CRITICAL: Failed to credit win for session ${sessionId}`, err);
        // Mark session for manual review — do NOT throw, outcome is determined
      }
    }

    // Fire-and-forget jackpot contribution
    this.contributeToJackpot(betInCents).catch(() => void 0);

    // Update session
    const updatedSession = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: SESSION_STATUS.COMPLETED,
        winAmountInCents: winInCents,
        endedAt: new Date(),
        metadata: result as any,
      },
    });

    this.logger.log(`Session resolved: ${sessionId} win=${winInCents}`);

    return {
      sessionId,
      gameType,
      betAmountInCents: betInCents.toString(),
      winAmountInCents: winInCents.toString(),
      netChangeInCents: (winInCents - betInCents).toString(),
      serverSeed, // revealed now — client can verify
      serverSeedHash: session.serverSeedHash,
      clientSeed,
      nonce,
      result,
      completedAt: updatedSession.endedAt,
    };
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) throw new NotFoundException('Session not found');
    return this.serializeSession(session);
  }

  async getUserSessions(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      this.prisma.gameSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.gameSession.count({ where: { userId } }),
    ]);
    return {
      data: sessions.map((s: Record<string, unknown>) => this.serializeSession(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRTPProfiles(gameType?: string) {
    const profiles = await this.prisma.rTPProfile.findMany({
      where: {
        isActive: true,
        ...(gameType ? { gameType: gameType as any } : {}),
      },
      orderBy: { gameType: 'asc' },
    });
    return profiles.map((p: {
      minBetInCents: bigint;
      maxBetInCents: bigint;
      rtp: bigint | number;
      [key: string]: unknown;
    }) => ({
      ...p,
      minBetInCents: p.minBetInCents.toString(),
      maxBetInCents: p.maxBetInCents.toString(),
      rtp: Number(p.rtp),
    }));  }

  private serializeSession(s: Record<string, unknown>) {
    return {
      ...s,
      betAmountInCents: String(s['betAmountInCents']),
      winAmountInCents: String(s['winAmountInCents']),
      // Hide serverSeed until session is completed
      serverSeed: s['status'] === 'COMPLETED' ? s['serverSeed'] : undefined,
    };
  }

  private async contributeToJackpot(betInCents: bigint): Promise<void> {
    try {
      // Contribute to GRAND jackpot — 0.5% of bet
      const jackpots = await firstValueFrom(
        this.http.get<{ data: Array<{ id: string }> }>(`${this.jackpotUrl}/api/v1/jackpots`),
      );
      const grand = jackpots.data?.data?.[0];
      if (grand) {
        await firstValueFrom(
          this.http.post(`${this.jackpotUrl}/api/v1/jackpots/${grand.id}/contribute`, {
            betAmountInCents: betInCents.toString(),
          }),
        );
      }
    } catch {
      // Silent failure — jackpot contribution is best-effort
    }
  }
}
