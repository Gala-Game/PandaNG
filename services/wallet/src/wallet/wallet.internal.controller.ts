import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { IsString, IsOptional } from 'class-validator';

class InternalTransactionDto {
  @IsString()
  userId: string;

  @IsString()
  amountInCents: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Internal endpoints for service-to-service communication.
 * NOT protected by user JWT — only accessible inside the private network.
 * In production, restrict via network policy or an API key header.
 */
@ApiTags('internal')
@Controller('internal')
export class InternalWalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('debit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal: debit wallet (service-to-service)' })
  async debit(@Body() dto: InternalTransactionDto) {
    const amount = BigInt(dto.amountInCents);
    // TransactionType enum values match string literals in Prisma schema
    return this.walletService.debit(
      dto.userId,
      amount,
      dto.type as never, // will be properly typed once Prisma client is generated
      dto.reference,
      dto.description,
    );
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
