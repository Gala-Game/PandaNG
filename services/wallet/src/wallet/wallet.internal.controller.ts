import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Injectable,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { IsString, IsOptional, IsNumberString, IsEnum, Matches } from 'class-validator';
import { Type } from 'class-transformer';

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
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const key = req.headers['x-internal-api-key'];
    const expected = process.env['INTERNAL_API_KEY'];
    if (!expected) {
      throw new UnauthorizedException('INTERNAL_API_KEY is not configured');
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

  @Post('debit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal: debit wallet (service-to-service)' })
  async debit(@Body() dto: InternalTransactionDto) {
    const amount = BigInt(dto.amountInCents);
    const entry = await this.walletService.debit(
      dto.userId,
      amount,
      dto.type as never,
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
      dto.type as never,
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
