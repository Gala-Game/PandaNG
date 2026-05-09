import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CreateDepositDto } from './dto/deposit.dto';
import { CreateWithdrawalDto } from './dto/withdrawal.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './guards/jwt-auth.guard';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get my wallet details' })
  async getWallet(@CurrentUser() user: JwtPayload) {
    return this.walletService.getWallet(user.sub);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get my current balance' })
  async getBalance(@CurrentUser() user: JwtPayload) {
    return this.walletService.getBalance(user.sub);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get my transaction history (paginated)' })
  async getTransactions(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page ?? '1', 10);
    const limitNum = Math.min(parseInt(limit ?? '20', 10), 100);
    return this.walletService.getTransactions(user.sub, { page: pageNum, limit: limitNum });
  }

  @Post('deposit/initiate')
  @ApiOperation({ summary: 'Initiate a deposit' })
  async initiateDeposit(@CurrentUser() user: JwtPayload, @Body() dto: CreateDepositDto) {
    return this.walletService.initiateDeposit(user.sub, dto);
  }

  @Post('withdraw/request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request a withdrawal' })
  async requestWithdrawal(@CurrentUser() user: JwtPayload, @Body() dto: CreateWithdrawalDto) {
    return this.walletService.requestWithdrawal(user.sub, dto);
  }

  @Get('withdraw/:id')
  @ApiOperation({ summary: 'Get withdrawal status by ID' })
  async getWithdrawal(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.walletService.getWithdrawal(user.sub, id);
  }
}
