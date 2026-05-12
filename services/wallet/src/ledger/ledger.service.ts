import { Injectable, Logger } from '@nestjs/common';
import type { Prisma, TransactionType, WalletLedgerEntry } from '@prisma/client';

interface CreateLedgerEntryInput {
  walletId: string;
  type: TransactionType;
  amountInCents: bigint;
  balanceBeforeInCents: bigint;
  balanceAfterInCents: bigint;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  gameSessionId?: string;
  paymentId?: string;
}

type PrismaTxClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  // IMPORTANT: Ledger entries are IMMUTABLE — no update or delete operations allowed.
  async create(tx: PrismaTxClient, input: CreateLedgerEntryInput): Promise<WalletLedgerEntry> {
    const entry = await tx.walletLedgerEntry.create({
      data: {
        walletId: input.walletId,
        type: input.type,
        amountInCents: input.amountInCents,
        balanceBeforeInCents: input.balanceBeforeInCents,
        balanceAfterInCents: input.balanceAfterInCents,
        reference: input.reference,
        description: input.description,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        gameSessionId: input.gameSessionId,
        paymentId: input.paymentId,
      },
    });

    this.logger.debug(
      `Ledger entry created: ${entry.id} | type=${entry.type} | amount=${entry.amountInCents} | wallet=${entry.walletId}`,
    );

    return entry;
  }

  // No update() — ledger entries are immutable
  // No delete() — ledger entries are immutable
}
