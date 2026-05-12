import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JackpotService } from './jackpot.service';
import { ContributeDto } from './dto/contribute.dto';
import { TriggerWinDto } from './dto/trigger-win.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './guards/jwt-auth.guard';

@ApiTags('jackpots')
@Controller('jackpots')
export class JackpotController {
  constructor(private readonly jackpotService: JackpotService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active jackpot tiers with current amounts' })
  async getAllJackpots() {
    return this.jackpotService.getAllJackpots();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get jackpot by ID' })
  async getJackpot(@Param('id') id: string) {
    return this.jackpotService.getJackpot(id);
  }

  @Post(':id/contribute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contribute to jackpot from game bet (called by game engine)' })
  async contribute(@Param('id') id: string, @Body() dto: ContributeDto) {
    return this.jackpotService.contributeToJackpot(id, dto);
  }

  @Post(':id/trigger-win')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Force trigger a jackpot win' })
  async triggerWin(
    @Param('id') id: string,
    @Body() dto: TriggerWinDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.jackpotService.triggerWin(id, dto.userId, dto.gameSessionId, admin.sub);
  }
}
