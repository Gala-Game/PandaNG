import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './guards/jwt-auth.guard';

@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('vip-level')
  @ApiOperation({ summary: 'Get current user VIP status, XP and cashback rate' })
  async getVIPLevel(@CurrentUser() user: JwtPayload) {
    return this.rewardsService.getVIPStatus(user.sub);
  }

  @Get('missions')
  @ApiOperation({ summary: 'Get active and available missions for the current user' })
  async getMissions(@CurrentUser() user: JwtPayload) {
    return this.rewardsService.getMissions(user.sub);
  }

  @Post('missions/:id/claim')
  @ApiOperation({ summary: 'Claim a completed mission reward' })
  async claimMission(@CurrentUser() user: JwtPayload, @Param('id') missionId: string) {
    return this.rewardsService.claimMission(user.sub, missionId);
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get unlocked and locked achievements for the current user' })
  async getAchievements(@CurrentUser() user: JwtPayload) {
    return this.rewardsService.getAchievements(user.sub);
  }

  @Get('battle-pass')
  @ApiOperation({ summary: 'Get the current active battle pass and user progress' })
  async getBattlePass(@CurrentUser() user: JwtPayload) {
    return this.rewardsService.getBattlePass(user.sub);
  }

  @Post('cashback/claim')
  @ApiOperation({ summary: 'Claim weekly cashback based on VIP level' })
  async claimCashback(@CurrentUser() user: JwtPayload) {
    return this.rewardsService.claimCashback(user.sub);
  }
}
