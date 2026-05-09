import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FraudRiskLevel } from '@panda-ng/types';
import { buildPaginatedResult, normalizePagination, getPaginationOffset } from '@panda-ng/utils';

interface ScoreTransactionDto {
  userId: string;
  amountInCents: number;
  type: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  metadata?: Record<string, unknown>;
}

interface RiskScore {
  score: number;
  riskLevel: FraudRiskLevel;
  flags: string[];
  shouldBlock: boolean;
}

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  // 50,000 PHP in cents
  private readonly LARGE_TRANSACTION_THRESHOLD = 5_000_000n;
  private readonly VELOCITY_WINDOW_MINUTES = 60;
  private readonly MAX_TRANSACTIONS_PER_HOUR = 20;
  // Min amount to flag unverified KYC users: 5,000 PHP in cents
  private readonly KYC_CHECK_THRESHOLD = 500_000n;
  // Min amount to flag new accounts: 1,000 PHP in cents
  private readonly NEW_ACCOUNT_THRESHOLD = 100_000n;

  constructor(private readonly prisma: PrismaService) {}

  async scoreTransaction(dto: ScoreTransactionDto): Promise<RiskScore> {
    let score = 0;
    const flags: string[] = [];

    // 1. Large transaction check
    if (BigInt(dto.amountInCents) >= this.LARGE_TRANSACTION_THRESHOLD) {
      score += 30;
      flags.push('LARGE_TRANSACTION');
    }

    // 2. Velocity check: too many transactions in rolling window
    const windowStart = new Date(Date.now() - this.VELOCITY_WINDOW_MINUTES * 60 * 1000);
    const recentPayments = await this.prisma.payment.count({
      where: { userId: dto.userId, createdAt: { gte: windowStart } },
    });
    if (recentPayments >= this.MAX_TRANSACTIONS_PER_HOUR) {
      score += 40;
      flags.push('HIGH_VELOCITY');
    }

    // 3. New account + large transaction
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { createdAt: true, kycStatus: true, country: true },
    });

    if (user) {
      const accountAgeHours = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60);
      if (accountAgeHours < 24 && BigInt(dto.amountInCents) > this.NEW_ACCOUNT_THRESHOLD) {
        score += 25;
        flags.push('NEW_ACCOUNT_LARGE_TX');
      }

      // 4. Unverified KYC on large amount
      if (
        user.kycStatus !== 'VERIFIED' &&
        BigInt(dto.amountInCents) > this.KYC_CHECK_THRESHOLD
      ) {
        score += 20;
        flags.push('UNVERIFIED_KYC_LARGE_TX');
      }
    }

    // 5. Device fingerprint: same device used by multiple users
    if (dto.deviceFingerprint) {
      const deviceHistory = await this.prisma.deviceFingerprint.findMany({
        where: { fingerprint: dto.deviceFingerprint, isTrusted: false },
        select: { userId: true },
      });
      const uniqueUsers = new Set(deviceHistory.map((d) => d.userId));
      if (uniqueUsers.size >= 2) {
        score += 50;
        flags.push('SHARED_DEVICE');
      }
    }

    const riskLevel = this.calculateRiskLevel(score);
    const shouldBlock = score >= 80;

    // Auto-create signal for high-risk activity
    if (score >= 60) {
      await this.createSignal({
        userId: dto.userId,
        signalType: `HIGH_RISK_${dto.type}`,
        severity: riskLevel,
        data: {
          score,
          flags,
          amountInCents: dto.amountInCents,
          ipAddress: dto.ipAddress,
          ...dto.metadata,
        },
      });
    }

    this.logger.log(
      `Fraud score: userId=${dto.userId} score=${score} level=${riskLevel} flags=${flags.join(',')}`,
    );

    return { score, riskLevel, flags, shouldBlock };
  }

  async getSignals(pagination: { page: number; limit: number }, isResolved?: boolean) {
    const normalized = normalizePagination(pagination);
    const where = isResolved !== undefined ? { isResolved } : {};

    const [signals, total] = await Promise.all([
      this.prisma.fraudSignal.findMany({
        where,
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        skip: getPaginationOffset(normalized),
        take: normalized.limit,
        include: { user: { select: { username: true, email: true } } },
      }),
      this.prisma.fraudSignal.count({ where }),
    ]);

    return buildPaginatedResult(signals, total, normalized);
  }

  async resolveSignal(signalId: string, resolvedBy: string, notes?: string) {
    const signal = await this.prisma.fraudSignal.findUnique({ where: { id: signalId } });
    if (!signal) throw new NotFoundException('Fraud signal not found');

    return this.prisma.fraudSignal.update({
      where: { id: signalId },
      data: { isResolved: true, resolvedBy, resolvedAt: new Date(), notes },
    });
  }

  async registerDevice(
    userId: string,
    fingerprint: string,
    deviceInfo: Record<string, string>,
  ) {
    const existing = await this.prisma.deviceFingerprint.findUnique({
      where: { userId_fingerprint: { userId, fingerprint } },
    });

    if (existing) {
      return this.prisma.deviceFingerprint.update({
        where: { userId_fingerprint: { userId, fingerprint } },
        data: { seenCount: { increment: 1 }, lastSeenAt: new Date() },
      });
    }

    // Check if device is known from other users
    const otherUsers = await this.prisma.deviceFingerprint.findMany({
      where: { fingerprint, userId: { not: userId } },
      select: { userId: true },
    });

    const isSuspicious = otherUsers.length > 0;
    if (isSuspicious) {
      await this.createSignal({
        userId,
        signalType: 'SHARED_DEVICE_REGISTRATION',
        severity: FraudRiskLevel.MEDIUM,
        data: { fingerprint, otherUserCount: otherUsers.length, ...deviceInfo },
      });
    }

    return this.prisma.deviceFingerprint.create({
      data: {
        userId,
        fingerprint,
        deviceType: deviceInfo['deviceType'],
        os: deviceInfo['os'],
        browser: deviceInfo['browser'],
        ipAddress: deviceInfo['ipAddress'],
        isTrusted: !isSuspicious,
      },
    });
  }

  private async createSignal(data: {
    userId: string;
    signalType: string;
    severity: FraudRiskLevel;
    data: Record<string, unknown>;
  }) {
    return this.prisma.fraudSignal.create({ data });
  }

  private calculateRiskLevel(score: number): FraudRiskLevel {
    if (score >= 80) return FraudRiskLevel.CRITICAL;
    if (score >= 60) return FraudRiskLevel.HIGH;
    if (score >= 30) return FraudRiskLevel.MEDIUM;
    return FraudRiskLevel.LOW;
  }
}
