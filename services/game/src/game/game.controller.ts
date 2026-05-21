import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GameService } from './game.service';
import {
  StartSessionDto,
  ResolveSlotsDto,
  ResolveCrashDto,
  ResolveDiceDto,
  ResolveWheelDto,
  ResolveTreasureDto,
} from './dto/game.dto';

interface AuthRequest {
  user: { sub: string };
}

@ApiTags('games')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('rtp-profiles')
  @ApiOperation({ summary: 'List active RTP profiles' })
  @ApiQuery({ name: 'gameType', required: false })
  getRTPProfiles(@Query('gameType') gameType?: string) {
    return this.gameService.getRTPProfiles(gameType);
  }

  @Post('session/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a game session and deduct bet from wallet' })
  startSession(@Request() req: AuthRequest, @Body() dto: StartSessionDto) {
    return this.gameService.startSession(
      req.user.sub,
      dto.gameType,
      dto.betAmountInCents,
      dto.clientSeed,
      dto.rtpProfileId,
    );
  }

  @Post('session/resolve/slots')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a slots session' })
  resolveSlots(@Request() req: AuthRequest, @Body() dto: ResolveSlotsDto) {
    return this.gameService.resolveSlots(req.user.sub, dto.sessionId);
  }

  @Post('session/resolve/crash')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a crash session (cash out)' })
  resolveCrash(@Request() req: AuthRequest, @Body() dto: ResolveCrashDto) {
    return this.gameService.resolveCrash(req.user.sub, dto.sessionId, dto.cashoutMultiplier);
  }

  @Post('session/resolve/dice')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a dice session' })
  resolveDice(@Request() req: AuthRequest, @Body() dto: ResolveDiceDto) {
    return this.gameService.resolveDice(req.user.sub, dto.sessionId, dto.target, dto.mode);
  }

  @Post('session/resolve/wheel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a spin-wheel session' })
  resolveWheel(@Request() req: AuthRequest, @Body() dto: ResolveWheelDto) {
    return this.gameService.resolveWheel(req.user.sub, dto.sessionId);
  }

  @Post('session/resolve/treasure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a treasure hunt session' })
  resolveTreasure(@Request() req: AuthRequest, @Body() dto: ResolveTreasureDto) {
    return this.gameService.resolveTreasure(req.user.sub, dto.sessionId, dto.pickedIndices);
  }

  @Get('session/:id/verify')
  @ApiOperation({ summary: 'Provably fair verification: reveal server seed and verify outcome' })
  verifySession(@Param('id') sessionId: string) {
    return this.gameService.verifySession(sessionId);
  }
}
