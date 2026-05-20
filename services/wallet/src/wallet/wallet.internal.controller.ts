import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
  Injectable,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { IsString, IsOptional, IsNumberString, IsEnum, Matches } from 'class-validator';
import { TransactionType } from '@prisma/client';

/** Allowed transaction types for internal service-to-service calls */
enum InternalTransactionType {
  BET = 'BET',
  WIN = 'WIN',
  BONUS = 'BONUS',
  REFUND = 'REFUND',
  JACKPOT_WIN = 'JACKPOT_WIN',
  MISSION_REWARD = 'MISSION_REWARD',
}

class InternalTransactionDto {
  @IsString()
  userId: string;

  /** Must be a positive integer string (≥1) — will be converted to BigInt */
  @IsNumberString({ no_symbols: true })
  @Matches(/^[1-9][0-9]*$/, { message: 'amountInCents must be a positive integer string' })
  amountInCents: string;

  @IsEnum(InternalTransactionType)
  type: InternalTransactionType;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Guard that enforces X-Internal-Api-Key header for service-to-service calls.
 * In production this is backed by a secret stored in INTERNAL_API_KEY env var.
 */
@Injectable()
class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const key = req.headers['x-internal-api-key'];
    const expected = this.configService.get<string>('INTERNAL_API_KEY');
    if (!expected) {
      throw new InternalServerErrorException('INTERNAL_API_KEY is not configured');
    }
    if (!key || key !== expected) {
      throw new UnauthorizedException('Invalid internal API key');
    }
    return true;
  }
}

/**
 * Internal endpoints for service-to-service communication.
 * Protected by X-Internal-Api-Key header — must NOT be publicly routable.
 */
@ApiTags('internal')
@Controller('internal')
@UseGuards(InternalApiKeyGuard)
export class InternalWalletController {
  constructor(private readonly walletService: WalletService) {}

  private mapInternalType(type: InternalTransactionType): TransactionType {
    switch (type) {
      case InternalTransactionType.BET:
        return TransactionType.BET;
      case InternalTransactionType.WIN:
        return TransactionType.WIN;
      case InternalTransactionType.BONUS:
        return TransactionType.BONUS;
      case InternalTransactionType.REFUND:
        return TransactionType.REFUND;
      case InternalTransactionType.JACKPOT_WIN:
        return TransactionType.JACKPOT_WIN;
      case InternalTransactionType.MISSION_REWARD:
        return TransactionType.MISSION_REWARD;
      default:
        throw new UnauthorizedException('Invalid transaction type');
    }
  }

  @Post('debit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal: debit wallet (service-to-service)' })
  async debit(@Body() dto: InternalTransactionDto) {
    const amount = BigInt(dto.amountInCents);
    const entry = await this.walletService.debit(
      dto.userId,
      amount,
      this.mapInternalType(dto.type),
      dto.reference,
      dto.description,
    );
    // Serialize BigInt fields — JSON.stringify throws on native BigInt
    return {
      ...entry,
      amountInCents: entry.amountInCents.toString(),
      balanceBeforeInCents: entry.balanceBeforeInCents.toString(),
      balanceAfterInCents: entry.balanceAfterInCents.toString(),
    };
  }

  @Post('credit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal: credit wallet (service-to-service)' })
  async credit(@Body() dto: InternalTransactionDto) {
    const amount = BigInt(dto.amountInCents);
    const entry = await this.walletService.credit(
      dto.userId,
      amount,
      this.mapInternalType(dto.type),
      dto.reference,
      dto.description,
    );
    return {
      ...entry,
      amountInCents: entry.amountInCents.toString(),
      balanceBeforeInCents: entry.balanceBeforeInCents.toString(),
      balanceAfterInCents: entry.balanceAfterInCents.toString(),
    };
  }
}
