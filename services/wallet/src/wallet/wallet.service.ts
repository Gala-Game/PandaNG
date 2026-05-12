import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { CreateDepositDto } from './dto/deposit.dto';
import { CreateWithdrawalDto } from './dto/withdrawal.dto';
import { generateSecureToken, startOfDay } from '@panda-ng/utils';
import {
  buildPaginatedResult,
  normalizePagination,
  getPaginationOffset,
} from '@panda-ng/utils';
import type { PaginatedResult } from '@panda-ng/utils';
import type { WalletLedgerEntry, TransactionType } from '@prisma/client';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  // Minimum withdrawal: 100 PHP (10000 cents)
  private readonly MIN_WITHDRAWAL_CENTS = 10000n;
  // Maximum daily withdrawal: 100,000 PHP (10,000,000 cents)
  private readonly MAX_DAILY_WITHDRAWAL_CENTS = 10_000_000n;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    // Serialize BigInt fields before returning — JSON.stringify throws on native BigInt
    return {
      ...wallet,
      balanceInCents: wallet.balanceInCents.toString(),
      bonusBalanceInCents: wallet.bonusBalanceInCents.toString(),
      totalDepositedInCents: wallet.totalDepositedInCents.toString(),
      totalWithdrawnInCents: wallet.totalWithdrawnInCents.toString(),
      totalWageredInCents: wallet.totalWageredInCents.toString(),
      totalWonInCents: wallet.totalWonInCents.toString(),
    };
  }

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { balanceInCents: true, bonusBalanceInCents: true, currency: true },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    // Serialize BigInt to string — JSON.stringify throws on native BigInt
    return {
      balanceInCents: wallet.balanceInCents.toString(),
      bonusBalanceInCents: wallet.bonusBalanceInCents.toString(),
      currency: wallet.currency,
    };
  }

  async getTransactions(
    userId: string,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const normalized = normalizePagination(pagination);
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const [entries, total] = await Promise.all([
      this.prisma.walletLedgerEntry.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip: getPaginationOffset(normalized),
        take: normalized.limit,
      }),
      this.prisma.walletLedgerEntry.count({ where: { walletId: wallet.id } }),
    ]);

    // Serialize BigInt fields before JSON response
    const serialized = entries.map((e) => ({
      ...e,
      amountInCents: e.amountInCents.toString(),
      balanceBeforeInCents: e.balanceBeforeInCents.toString(),
      balanceAfterInCents: e.balanceAfterInCents.toString(),
    }));

    return buildPaginatedResult(serialized, total, normalized);
  }

  async credit(
    userId: string,
    amountInCents: bigint,
    type: TransactionType,
    reference?: string,
    description?: string,
    metadata?: Record<string, unknown>,
  ): Promise<WalletLedgerEntry> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        select: { id: true, balanceInCents: true },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const balanceBefore = wallet.balanceInCents;
      const balanceAfter = balanceBefore + amountInCents;

      await tx.wallet.update({
        where: { userId },
        data: {
          balanceInCents: balanceAfter,
          ...(type === TransactionType.DEPOSIT && {
            totalDepositedInCents: { increment: amountInCents },
          }),
          ...(type === TransactionType.WIN || type === TransactionType.JACKPOT_WIN
            ? { totalWonInCents: { increment: amountInCents } }
            : {}),
        },
      });

      return this.ledger.create(tx, {
        walletId: wallet.id,
        type,
        amountInCents,
        balanceBeforeInCents: balanceBefore,
        balanceAfterInCents: balanceAfter,
        reference,
        description,
        metadata,
      });
    });
  }

  async debit(
    userId: string,
    amountInCents: bigint,
    type: TransactionType,
    reference?: string,
    description?: string,
    metadata?: Record<string, unknown>,
  ): Promise<WalletLedgerEntry> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        select: { id: true, balanceInCents: true, isLocked: true },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');
      if (wallet.isLocked) throw new BadRequestException('Wallet is temporarily locked');

      if (wallet.balanceInCents < amountInCents) {
        throw new BadRequestException('Insufficient funds');
      }

      const balanceBefore = wallet.balanceInCents;
      const balanceAfter = balanceBefore - amountInCents;

      await tx.wallet.update({
        where: { userId },
        data: {
          balanceInCents: balanceAfter,
          ...(type === TransactionType.BET && {
            totalWageredInCents: { increment: amountInCents },
          }),
        },
      });

      return this.ledger.create(tx, {
        walletId: wallet.id,
        type,
        amountInCents,
        balanceBeforeInCents: balanceBefore,
        balanceAfterInCents: balanceAfter,
        reference,
        description,
        metadata,
      });
    });
  }

  async initiateDeposit(userId: string, dto: CreateDepositDto) {
    const reference = `DEP-${generateSecureToken(8).toUpperCase()}`;

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        provider: dto.provider,
        method: dto.method,
        amountInCents: BigInt(dto.amountInCents),
        currency: dto.currency,
        reference,
        status: 'INITIATED',
      },
    });

    this.logger.log(
      `Deposit initiated: ${reference} for user ${userId} - ${dto.amountInCents} cents`,
    );

    // TODO: Integrate with actual payment gateway (GCash, Maya, etc.)
    return {
      paymentId: payment.id,
      reference,
      status: 'INITIATED',
      checkoutUrl: `https://payment-gateway.example.com/checkout/${reference}`,
      amountInCents: dto.amountInCents,
    };
  }

  async requestWithdrawal(userId: string, dto: CreateWithdrawalDto) {
    const amountInCents = BigInt(dto.amountInCents);

    if (amountInCents < this.MIN_WITHDRAWAL_CENTS) {
      throw new BadRequestException(
        `Minimum withdrawal is ₱${Number(this.MIN_WITHDRAWAL_CENTS) / 100}`,
      );
    }

    const todayStart = startOfDay(new Date());

    // Single atomic transaction: balance debit + ledger entry + withdrawal record
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        select: { id: true, balanceInCents: true, isLocked: true },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');
      if (wallet.isLocked) throw new BadRequestException('Wallet is temporarily locked');

      if (wallet.balanceInCents < amountInCents) {
        throw new BadRequestException('Insufficient funds for withdrawal');
      }

      // Check daily withdrawal limit inside the transaction
      const dailyWithdrawals = await tx.withdrawal.aggregate({
        where: {
          userId,
          createdAt: { gte: todayStart },
          status: { notIn: ['REJECTED', 'FAILED'] },
        },
        _sum: { amountInCents: true },
      });

      const todayTotal = dailyWithdrawals._sum.amountInCents ?? 0n;
      if (todayTotal + amountInCents > this.MAX_DAILY_WITHDRAWAL_CENTS) {
        throw new BadRequestException('Daily withdrawal limit exceeded');
      }

      const balanceBefore = wallet.balanceInCents;
      const balanceAfter = balanceBefore - amountInCents;

      // Debit the wallet
      await tx.wallet.update({
        where: { userId },
        data: { balanceInCents: balanceAfter },
      });

      // Immutable ledger entry
      await this.ledger.create(tx, {
        walletId: wallet.id,
        type: TransactionType.WITHDRAWAL,
        amountInCents,
        balanceBeforeInCents: balanceBefore,
        balanceAfterInCents: balanceAfter,
        description: 'Withdrawal request reserved',
      });

      // Withdrawal record — same transaction, fully atomic with the debit
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amountInCents,
          currency: dto.currency ?? 'PHP',
          provider: dto.provider,
          accountDetails: {
            bankAccountNumber: dto.bankAccountNumber,
            bankCode: dto.bankCode,
            eWalletNumber: dto.eWalletNumber,
            accountName: dto.accountName,
          },
          status: 'PENDING',
        },
      });

      this.logger.log(
        `Withdrawal requested: ${withdrawal.id} for user ${userId} - ${amountInCents} cents`,
      );

      return { ...withdrawal, amountInCents: withdrawal.amountInCents.toString() };
    });
  }

  async getWithdrawal(userId: string, withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });
    if (!withdrawal || withdrawal.userId !== userId) {
      throw new NotFoundException('Withdrawal not found');
    }
    // Serialize BigInt fields before returning — JSON.stringify throws on native BigInt
    return { ...withdrawal, amountInCents: withdrawal.amountInCents.toString() };
  }
}
