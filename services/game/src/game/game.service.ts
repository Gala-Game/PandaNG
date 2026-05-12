import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  generateServerSeed,
  generateClientSeed,
  hashServerSeed,
  spinSlots,
  computeCrashPoint,
  calculateCrashWin,
  resolveDice,
  spinWheel,
  resolveTreasureHunt,
  validateBet,
  computeJackpotContribution,
} from '@panda-ng/game-sdk';
import { GameTypeDto } from './dto/game.dto';
import type { GameSession, RTPProfile } from '@prisma/client';
import { GameGateway } from './game.gateway';

const JACKPOT_CONTRIBUTION_BPS = 50; // 0.50% per bet

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GameGateway,
  ) {}

  // ─── RTP Profiles ──────────────────────────────────────────────────────────

  async getRTPProfiles(gameType?: string) {
    return this.prisma.rTPProfile.findMany({
      where: {
        isActive: true,
        ...(gameType ? { gameType: gameType as never } : {}),
      },
      orderBy: [{ gameType: 'asc' }, { name: 'asc' }],
    });
  }

  // ─── Session Start ──────────────────────────────────────────────────────────

  async startSession(
    userId: string,
    gameType: GameTypeDto,
    betAmountInCents: number,
    providedClientSeed?: string,
    rtpProfileId?: string,
  ) {
    const betBigInt = BigInt(betAmountInCents);

    // Get RTP profile
    const rtpProfile = await this.resolveRTPProfile(gameType, rtpProfileId);

    // Get wallet balance
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { balanceInCents: true, isLocked: true },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.isLocked) throw new ForbiddenException('Wallet is locked');

    // Validate bet
    const validation = validateBet(betBigInt, {
      minBetInCents: rtpProfile.minBetInCents,
      maxBetInCents: rtpProfile.maxBetInCents,
      rtp: Number(rtpProfile.rtp),
      variance: rtpProfile.variance as 'low' | 'medium' | 'high',
    }, wallet.balanceInCents);

    if (!validation.ok) {
      throw new BadRequestException(validation.reason);
    }

    const serverSeed = generateServerSeed();
    const clientSeed = providedClientSeed ?? generateClientSeed();
    const serverSeedHash = hashServerSeed(serverSeed);

    // Atomic: debit wallet + create session
    const session = await this.prisma.$transaction(async (tx) => {
      const w = await tx.wallet.findUnique({
        where: { userId },
        select: { id: true, balanceInCents: true },
      });
      if (!w) throw new NotFoundException('Wallet not found');
      if (w.balanceInCents < betBigInt) throw new BadRequestException('Insufficient funds');

      const balanceBefore = w.balanceInCents;
      const balanceAfter = balanceBefore - betBigInt;

      await tx.wallet.update({
        where: { userId },
        data: {
          balanceInCents: balanceAfter,
          totalWageredInCents: { increment: betBigInt },
        },
      });

      await tx.walletLedgerEntry.create({
        data: {
          walletId: w.id,
          type: 'BET',
          amountInCents: betBigInt,
          balanceBeforeInCents: balanceBefore,
          balanceAfterInCents: balanceAfter,
          description: `Bet placed — ${gameType}`,
        },
      });

      return tx.gameSession.create({
        data: {
          userId,
          gameType: gameType as never,
          betAmountInCents: betBigInt,
          rtpProfileId: rtpProfile.id,
          seed: clientSeed,
          serverSeed,
          serverSeedHash,
          clientSeed,
          nonce: 0,
          status: 'STARTED',
        },
      });
    });

    this.logger.log(
      `Game session started: ${session.id} | user=${userId} | game=${gameType} | bet=${betAmountInCents}`,
    );

    // Return server seed HASH only — never the seed itself until session ends
    return {
      sessionId: session.id,
      gameType,
      betAmountInCents,
      clientSeed,
      serverSeedHash,
      rtpProfile: {
        id: rtpProfile.id,
        rtp: rtpProfile.rtp.toString(),
        variance: rtpProfile.variance,
        minBetInCents: rtpProfile.minBetInCents.toString(),
        maxBetInCents: rtpProfile.maxBetInCents.toString(),
      },
    };
  }

  // ─── Session Resolve ────────────────────────────────────────────────────────

  async resolveSlots(userId: string, sessionId: string) {
    const session = await this.getActiveSession(userId, sessionId);
    const result = spinSlots(
      session.serverSeed,
      session.clientSeed,
      session.nonce,
      session.betAmountInCents,
    );

    const winAmountInCents = result.totalWinInCents;
    await this.finalizeSession(session, userId, winAmountInCents, {
      reels: result.reels,
      winLines: result.winLines,
      totalMultiplier: result.totalMultiplier,
      scatterCount: result.scatterCount,
      freeSpinsAwarded: result.freeSpinsAwarded,
      isJackpotSpin: result.isJackpotSpin,
    });

    // Jackpot contribution (fire-and-forget, don't block the response)
    this.contributeToJackpot(session.betAmountInCents).catch((e) =>
      this.logger.warn('Jackpot contribution failed', e),
    );

    return {
      sessionId,
      ...result,
      totalWinInCents: winAmountInCents.toString(),
      winLines: result.winLines.map((l) => ({ ...l, winInCents: l.winInCents.toString() })),
      serverSeed: session.serverSeed, // revealed only after session completes
    };
  }

  async resolveCrash(userId: string, sessionId: string, cashoutMultiplier: number) {
    const session = await this.getActiveSession(userId, sessionId);
    const crashPoint = computeCrashPoint(session.serverSeed, session.nonce);
    const winAmountInCents = calculateCrashWin(
      session.betAmountInCents,
      cashoutMultiplier,
      crashPoint,
    );

    await this.finalizeSession(session, userId, winAmountInCents, {
      crashPoint,
      cashoutMultiplier,
    });

    this.contributeToJackpot(session.betAmountInCents).catch((e) =>
      this.logger.warn('Jackpot contribution failed', e),
    );

    return {
      sessionId,
      crashPoint,
      cashoutMultiplier,
      isWin: cashoutMultiplier <= crashPoint,
      winAmountInCents: winAmountInCents.toString(),
      serverSeed: session.serverSeed,
    };
  }

  async resolveDice(
    userId: string,
    sessionId: string,
    target: number,
    mode: 'over' | 'under',
  ) {
    const session = await this.getActiveSession(userId, sessionId);
    const result = resolveDice(
      session.serverSeed,
      session.clientSeed,
      session.nonce,
      session.betAmountInCents,
      target,
      mode,
    );

    await this.finalizeSession(session, userId, result.winAmountInCents, {
      roll: result.roll,
      target: result.target,
      mode: result.mode,
      multiplier: result.multiplier,
    });

    this.contributeToJackpot(session.betAmountInCents).catch(() => null);

    return {
      sessionId,
      ...result,
      winAmountInCents: result.winAmountInCents.toString(),
      serverSeed: session.serverSeed,
    };
  }

  async resolveWheel(userId: string, sessionId: string) {
    const session = await this.getActiveSession(userId, sessionId);
    const result = spinWheel(
      session.serverSeed,
      session.clientSeed,
      session.nonce,
      session.betAmountInCents,
    );

    await this.finalizeSession(session, userId, result.winAmountInCents, {
      segment: result.segment,
      segmentIndex: result.segmentIndex,
    });

    this.contributeToJackpot(session.betAmountInCents).catch(() => null);

    return {
      sessionId,
      segmentIndex: result.segmentIndex,
      segment: result.segment,
      winAmountInCents: result.winAmountInCents.toString(),
      serverSeed: session.serverSeed,
    };
  }

  async resolveTreasure(userId: string, sessionId: string, pickedIndices: number[]) {
    const session = await this.getActiveSession(userId, sessionId);
    const result = resolveTreasureHunt(
      session.serverSeed,
      session.clientSeed,
      session.nonce,
      session.betAmountInCents,
      pickedIndices,
    );

    await this.finalizeSession(session, userId, result.winAmountInCents, {
      pickedIndices: result.pickedIndices,
      revealedTiles: result.revealedTiles,
      isBlown: result.isBlown,
      totalMultiplier: result.totalMultiplier,
      fullGrid: result.grid,
    });

    this.contributeToJackpot(session.betAmountInCents).catch(() => null);

    return {
      sessionId,
      revealedTiles: result.revealedTiles,
      isBlown: result.isBlown,
      totalMultiplier: result.totalMultiplier,
      winAmountInCents: result.winAmountInCents.toString(),
      fullGrid: result.grid, // full grid revealed once session ends
      serverSeed: session.serverSeed,
    };
  }

  // ─── Verify (Provably Fair) ─────────────────────────────────────────────────

  async verifySession(sessionId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        gameType: true,
        serverSeed: true,
        serverSeedHash: true,
        clientSeed: true,
        nonce: true,
        betAmountInCents: true,
        winAmountInCents: true,
        status: true,
        metadata: true,
        startedAt: true,
        endedAt: true,
      },
    });
    if (!session) throw new NotFoundException('Game session not found');
    if (session.status !== 'COMPLETED') {
      // Don't reveal server seed until game is over
      return {
        sessionId,
        status: session.status,
        message: 'Server seed will be revealed when the session is completed',
        serverSeedHash: session.serverSeedHash,
        clientSeed: session.clientSeed,
        nonce: session.nonce,
      };
    }

    // Verify hash matches seed
    const computedHash = hashServerSeed(session.serverSeed);
    const hashMatches = computedHash === session.serverSeedHash;

    return {
      sessionId,
      gameType: session.gameType,
      serverSeed: session.serverSeed,
      serverSeedHash: session.serverSeedHash,
      computedHash,
      hashMatches,
      clientSeed: session.clientSeed,
      nonce: session.nonce,
      betAmountInCents: session.betAmountInCents.toString(),
      winAmountInCents: session.winAmountInCents.toString(),
      metadata: session.metadata,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async resolveRTPProfile(
    gameType: GameTypeDto,
    rtpProfileId?: string,
  ): Promise<RTPProfile> {
    if (rtpProfileId) {
      const profile = await this.prisma.rTPProfile.findUnique({ where: { id: rtpProfileId } });
      if (!profile || !profile.isActive) {
        throw new NotFoundException('RTP profile not found or inactive');
      }
      return profile;
    }

    // Default: first active profile for this game type
    const profile = await this.prisma.rTPProfile.findFirst({
      where: { gameType: gameType as never, isActive: true },
    });
    if (!profile) throw new NotFoundException(`No active RTP profile found for ${gameType}`);
    return profile;
  }

  private async getActiveSession(userId: string, sessionId: string): Promise<GameSession> {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Game session not found');
    if (session.userId !== userId) throw new ForbiddenException('Not your session');
    if (session.status !== 'STARTED') {
      throw new BadRequestException(`Session is already ${session.status}`);
    }
    return session;
  }

  private async finalizeSession(
    session: GameSession,
    userId: string,
    winAmountInCents: bigint,
    metadata: Record<string, unknown>,
  ) {
    await this.prisma.$transaction(async (tx) => {
      // Credit winnings if any
      if (winAmountInCents > 0n) {
        const wallet = await tx.wallet.findUnique({
          where: { userId },
          select: { id: true, balanceInCents: true },
        });
        if (!wallet) throw new NotFoundException('Wallet not found');

        const balanceBefore = wallet.balanceInCents;
        const balanceAfter = balanceBefore + winAmountInCents;

        await tx.wallet.update({
          where: { userId },
          data: {
            balanceInCents: balanceAfter,
            totalWonInCents: { increment: winAmountInCents },
          },
        });

        await tx.walletLedgerEntry.create({
          data: {
            walletId: wallet.id,
            type: 'WIN',
            amountInCents: winAmountInCents,
            balanceBeforeInCents: balanceBefore,
            balanceAfterInCents: balanceAfter,
            gameSessionId: session.id,
            description: `Win — ${session.gameType}`,
          },
        });
      }

      // Close session (marks as COMPLETED and reveals server seed in metadata)
      await tx.gameSession.update({
        where: { id: session.id },
        data: {
          status: 'COMPLETED',
          winAmountInCents,
          endedAt: new Date(),
          metadata: metadata as never,
        },
      });
    });

    this.logger.log(
      `Session resolved: ${session.id} | win=${winAmountInCents} | user=${userId}`,
    );

    // Broadcast outcome to the user's WebSocket room
    this.gateway.emitGameResult(userId, {
      sessionId: session.id,
      gameType: session.gameType,
      betAmountInCents: session.betAmountInCents.toString(),
      winAmountInCents: winAmountInCents.toString(),
      ...metadata,
    });
  }

  private async contributeToJackpot(betAmountInCents: bigint) {
    const contribution = computeJackpotContribution(betAmountInCents, JACKPOT_CONTRIBUTION_BPS);
    if (contribution <= 0n) return;

    // Contribute to all active jackpots (lowest tier primarily)
    const jackpots = await this.prisma.jackpot.findMany({
      where: { isActive: true },
      orderBy: { tier: 'asc' },
      take: 1,
    });

    if (jackpots.length === 0) return;

    await this.prisma.jackpot.update({
      where: { id: jackpots[0]!.id },
      data: { currentAmountInCents: { increment: contribution } },
    });
  }
}
