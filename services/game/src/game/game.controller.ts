import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GameService } from './game.service';
import { StartGameDto } from './dto/start-game.dto';
import { ResolveGameDto } from './dto/resolve-game.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CurrentUser, JwtUser } from './decorators/current-user.decorator';

@ApiTags('games')
@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a game session and debit bet from wallet' })
  startSession(@CurrentUser() user: JwtUser, @Body() dto: StartGameDto) {
    return this.gameService.startSession(user.sub, dto);
  }

  @Post(':sessionId/resolve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve session — calculates outcome and credits win' })
  resolveSession(
    @CurrentUser() user: JwtUser,
    @Param('sessionId') sessionId: string,
    @Body() dto: ResolveGameDto,
  ) {
    return this.gameService.resolveSession(user.sub, sessionId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user game history' })
  getUserSessions(
    @CurrentUser() user: JwtUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.gameService.getUserSessions(user.sub, page, Math.min(limit, 100));
  }

  @Get('rtp-profiles')
  @ApiOperation({ summary: 'Get active RTP profiles' })
  getRTPProfiles(@Query('gameType') gameType?: string) {
    return this.gameService.getRTPProfiles(gameType);
  }

  @Get(':sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get session details' })
  getSession(@CurrentUser() user: JwtUser, @Param('sessionId') sessionId: string) {
    return this.gameService.getSession(user.sub, sessionId);
  }
}
