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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FraudService } from './fraud.service';
import { ScoreTransactionDto, RegisterDeviceDto, ResolveSignalDto } from './dto/fraud.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './guards/jwt-auth.guard';

@ApiTags('fraud')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fraud')
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Post('score')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Score a transaction/event for fraud risk' })
  async scoreTransaction(@Body() dto: ScoreTransactionDto) {
    return this.fraudService.scoreTransaction(dto);
  }

  @Get('signals')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'List fraud signals with pagination' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'resolved', required: false, type: Boolean })
  async getSignals(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('resolved') resolved?: string,
  ) {
    return this.fraudService.getSignals(
      { page: parseInt(page), limit: parseInt(limit) },
      resolved !== undefined ? resolved === 'true' : undefined,
    );
  }

  @Post('signals/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MODERATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a fraud signal' })
  async resolveSignal(
    @Param('id') id: string,
    @Body() dto: ResolveSignalDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.fraudService.resolveSignal(id, admin.sub, dto.notes);
  }

  @Post('device/register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a device fingerprint for the authenticated user' })
  async registerDevice(@CurrentUser() user: JwtPayload, @Body() dto: RegisterDeviceDto) {
    return this.fraudService.registerDevice(user.sub, dto.fingerprint, {
      deviceType: dto.deviceType ?? '',
      os: dto.os ?? '',
      browser: dto.browser ?? '',
      ipAddress: dto.ipAddress ?? '',
    });
  }
}
