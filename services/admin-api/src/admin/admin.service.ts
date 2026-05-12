import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginatedResult, normalizePagination, getPaginationOffset } from '@panda-ng/utils';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listUsers(
    pagination: { page: number; limit: number },
    filters: { status?: string; role?: string; search?: string },
  ) {
    const normalized = normalizePagination(pagination);
    const where = {
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.role ? { role: filters.role as never } : {}),
      ...(filters.search
        ? {
            OR: [
              { email: { contains: filters.search, mode: 'insensitive' as never } },
              { username: { contains: filters.search, mode: 'insensitive' as never } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
          kycStatus: true,
          vipLevel: true,
          createdAt: true,
          lastLoginAt: true,
          wallet: { select: { balanceInCents: true, currency: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: getPaginationOffset(normalized),
        take: normalized.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Serialize wallet BigInt fields before returning
    const serialized = users.map((u) => ({
      ...u,
      wallet: u.wallet
        ? { ...u.wallet, balanceInCents: u.wallet.balanceInCents.toString() }
        : null,
    }));

    return buildPaginatedResult(serialized, total, normalized);
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        kycProfile: true,
        fraudSignals: { where: { isResolved: false }, take: 5 },
        _count: { select: { gameSessions: true, payments: true, jackpotWins: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // Serialize wallet BigInt fields before returning
    return {
      ...user,
      wallet: user.wallet
        ? {
            ...user.wallet,
            balanceInCents: user.wallet.balanceInCents.toString(),
            bonusBalanceInCents: user.wallet.bonusBalanceInCents.toString(),
            totalDepositedInCents: user.wallet.totalDepositedInCents.toString(),
            totalWageredInCents: user.wallet.totalWageredInCents.toString(),
            totalWonInCents: user.wallet.totalWonInCents.toString(),
          }
        : null,
    };
  }

  async banUser(userId: string, reason: string) {
    this.logger.log(`Banning user ${userId}: ${reason}`);
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'BANNED' },
      select: { id: true, status: true, email: true },
    });
  }

  async unbanUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
      select: { id: true, status: true, email: true },
    });
  }

  async updateUserRole(userId: string, role: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as never },
      select: { id: true, role: true, email: true },
    });
  }

  async getAllJackpots() {
    return this.prisma.jackpot.findMany({ orderBy: { tier: 'asc' } });
  }

  async updateJackpotSeed(jackpotId: string, seedAmountInCents: bigint) {
    return this.prisma.jackpot.update({
      where: { id: jackpotId },
      data: { seedAmountInCents },
    });
  }

  async getPendingWithdrawals(pagination: { page: number; limit: number }) {
    const normalized = normalizePagination(pagination);
    const where = { status: 'PENDING' as never };

    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        include: {
          user: { select: { username: true, email: true, kycStatus: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip: getPaginationOffset(normalized),
        take: normalized.limit,
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    return buildPaginatedResult(withdrawals, total, normalized);
  }

  async approveWithdrawal(withdrawalId: string, adminId: string, notes?: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException('Withdrawal is not in PENDING status');
    }

    return this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'APPROVED',
        adminReviewedBy: adminId,
        adminNotes: notes,
        approvedAt: new Date(),
      },
    });
  }

  async rejectWithdrawal(withdrawalId: string, adminId: string, reason: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException('Withdrawal is not in PENDING status');
    }

    return this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'REJECTED',
        adminReviewedBy: adminId,
        adminNotes: reason,
        rejectedAt: new Date(),
      },
    });
  }

  async getFraudSignals(pagination: { page: number; limit: number }, isResolved?: boolean) {
    const normalized = normalizePagination(pagination);
    const where = isResolved !== undefined ? { isResolved } : {};

    const [signals, total] = await Promise.all([
      this.prisma.fraudSignal.findMany({
        where,
        include: { user: { select: { username: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: getPaginationOffset(normalized),
        take: normalized.limit,
      }),
      this.prisma.fraudSignal.count({ where }),
    ]);

    return buildPaginatedResult(signals, total, normalized);
  }

  async resolveFraudSignal(signalId: string, adminId: string, notes?: string) {
    return this.prisma.fraudSignal.update({
      where: { id: signalId },
      data: { isResolved: true, resolvedBy: adminId, resolvedAt: new Date(), notes },
    });
  }

  async getLiveOpsConfigs(environment: string) {
    return this.prisma.liveOpsConfig.findMany({
      where: { environment },
      orderBy: { key: 'asc' },
    });
  }

  async createLiveOpsConfig(
    data: { key: string; value: unknown; description?: string; environment?: string },
    createdBy: string,
  ) {
    return this.prisma.liveOpsConfig.create({
      data: {
        key: data.key,
        value: data.value as never,
        environment: data.environment ?? 'production',
        description: data.description,
        createdBy,
      },
    });
  }

  async updateLiveOpsConfig(
    id: string,
    data: { value: unknown; description?: string },
    updatedBy: string,
  ) {
    return this.prisma.liveOpsConfig.update({
      where: { id },
      data: { value: data.value as never, description: data.description, updatedBy },
    });
  }

  async getPromotions(pagination: { page: number; limit: number }) {
    const normalized = normalizePagination(pagination);
    const [promotions, total] = await Promise.all([
      this.prisma.promotion.findMany({
        orderBy: { createdAt: 'desc' },
        skip: getPaginationOffset(normalized),
        take: normalized.limit,
      }),
      this.prisma.promotion.count(),
    ]);
    return buildPaginatedResult(promotions, total, normalized);
  }

  async createPromotion(data: Record<string, unknown>) {
    return this.prisma.promotion.create({ data: data as never });
  }

  async deactivatePromotion(id: string) {
    return this.prisma.promotion.update({ where: { id }, data: { isActive: false } });
  }
}
