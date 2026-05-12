import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './guards/jwt-auth.guard';
import { AdminAction } from '@panda-ng/types';

@ApiTags('admin')
@ApiBearerAuth()
@ApiSecurity('admin-api-key')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly audit: AuditService,
  ) {}

  // ── USER MANAGEMENT ───────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users with pagination and filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers(
      { page: parseInt(page), limit: parseInt(limit) },
      { status, role, search },
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get detailed user information including wallet and KYC' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ban a user account' })
  async banUser(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.adminService.banUser(id, body.reason);
    await this.audit.log({
      actorId: admin.sub,
      action: AdminAction.BAN_USER,
      resource: 'User',
      resourceId: id,
      after: { reason: body.reason, status: 'BANNED' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  @Post('users/:id/unban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unban a user account' })
  async unbanUser(
    @Param('id') id: string,
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.adminService.unbanUser(id);
    await this.audit.log({
      actorId: admin.sub,
      action: AdminAction.UNBAN_USER,
      resource: 'User',
      resourceId: id,
      after: { status: 'ACTIVE' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  @Patch('users/:id/role')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update user role (SUPER_ADMIN only)' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.adminService.updateUserRole(id, body.role);
    await this.audit.log({
      actorId: admin.sub,
      action: AdminAction.UPDATE_USER_ROLE,
      resource: 'User',
      resourceId: id,
      after: { role: body.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  // ── JACKPOT CONTROLS ──────────────────────────────────────────────────────

  @Get('jackpots')
  @ApiOperation({ summary: 'Get all jackpots with current amounts' })
  async getJackpots() {
    return this.adminService.getAllJackpots();
  }

  @Patch('jackpots/:id/seed')
  @ApiOperation({ summary: 'Update jackpot seed amount' })
  async updateJackpotSeed(
    @Param('id') id: string,
    @Body() body: { seedAmountInCents: number },
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.adminService.updateJackpotSeed(id, BigInt(body.seedAmountInCents));
    await this.audit.log({
      actorId: admin.sub,
      action: AdminAction.UPDATE_JACKPOT_SEED,
      resource: 'Jackpot',
      resourceId: id,
      after: { seedAmountInCents: body.seedAmountInCents },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  // ── WITHDRAWAL APPROVALS ──────────────────────────────────────────────────

  @Get('withdrawals/pending')
  @ApiOperation({ summary: 'List pending withdrawal approval requests' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPendingWithdrawals(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminService.getPendingWithdrawals({
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Post('withdrawals/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a withdrawal request' })
  async approveWithdrawal(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.adminService.approveWithdrawal(id, admin.sub, body.notes);
    await this.audit.log({
      actorId: admin.sub,
      action: AdminAction.APPROVE_WITHDRAWAL,
      resource: 'Withdrawal',
      resourceId: id,
      after: { notes: body.notes },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  @Post('withdrawals/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a withdrawal request' })
  async rejectWithdrawal(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.adminService.rejectWithdrawal(id, admin.sub, body.reason);
    await this.audit.log({
      actorId: admin.sub,
      action: AdminAction.REJECT_WITHDRAWAL,
      resource: 'Withdrawal',
      resourceId: id,
      after: { reason: body.reason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  // ── FRAUD ─────────────────────────────────────────────────────────────────

  @Get('fraud/signals')
  @ApiOperation({ summary: 'List fraud signals' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'resolved', required: false, type: Boolean })
  async getFraudSignals(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('resolved') resolved?: string,
  ) {
    return this.adminService.getFraudSignals(
      { page: parseInt(page), limit: parseInt(limit) },
      resolved !== undefined ? resolved === 'true' : undefined,
    );
  }

  @Post('fraud/signals/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a fraud signal as resolved' })
  async resolveFraudSignal(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.adminService.resolveFraudSignal(id, admin.sub, body.notes);
    await this.audit.log({
      actorId: admin.sub,
      action: AdminAction.RESOLVE_FRAUD_SIGNAL,
      resource: 'FraudSignal',
      resourceId: id,
      after: { notes: body.notes },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  // ── LIVEOPS CONFIG ────────────────────────────────────────────────────────

  @Get('liveops')
  @ApiOperation({ summary: 'List LiveOps config entries by environment' })
  @ApiQuery({ name: 'env', required: false })
  async getLiveOpsConfigs(@Query('env') environment = 'production') {
    return this.adminService.getLiveOpsConfigs(environment);
  }

  @Post('liveops')
  @ApiOperation({ summary: 'Create a new LiveOps config entry' })
  async createLiveOpsConfig(
    @Body()
    body: {
      key: string;
      value: unknown;
      description?: string;
      environment?: string;
    },
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.adminService.createLiveOpsConfig(body, admin.sub);
    await this.audit.log({
      actorId: admin.sub,
      action: AdminAction.UPDATE_LIVEOPS_CONFIG,
      resource: 'LiveOpsConfig',
      after: { key: body.key, environment: body.environment },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  @Patch('liveops/:id')
  @ApiOperation({ summary: 'Update an existing LiveOps config entry' })
  async updateLiveOpsConfig(
    @Param('id') id: string,
    @Body() body: { value: unknown; description?: string },
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.adminService.updateLiveOpsConfig(id, body, admin.sub);
    await this.audit.log({
      actorId: admin.sub,
      action: AdminAction.UPDATE_LIVEOPS_CONFIG,
      resource: 'LiveOpsConfig',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  // ── PROMOTIONS ────────────────────────────────────────────────────────────

  @Get('promotions')
  @ApiOperation({ summary: 'List promotions with pagination' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPromotions(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminService.getPromotions({ page: parseInt(page), limit: parseInt(limit) });
  }

  @Post('promotions')
  @ApiOperation({ summary: 'Create a new promotion' })
  async createPromotion(
    @Body() body: Record<string, unknown>,
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.adminService.createPromotion(body);
    await this.audit.log({
      actorId: admin.sub,
      action: AdminAction.CREATE_PROMOTION,
      resource: 'Promotion',
      after: body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  @Delete('promotions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a promotion' })
  async deactivatePromotion(
    @Param('id') id: string,
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ) {
    await this.adminService.deactivatePromotion(id);
    await this.audit.log({
      actorId: admin.sub,
      action: AdminAction.DEACTIVATE_PROMOTION,
      resource: 'Promotion',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  // ── AUDIT LOGS ────────────────────────────────────────────────────────────

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get paginated, filterable audit logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'resource', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getAuditLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.audit.getLogs(
      { page: parseInt(page), limit: parseInt(limit) },
      {
        actorId,
        action,
        resource,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      },
    );
  }
}
