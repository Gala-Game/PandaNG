import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminAction } from '@panda-ng/types';
import {
  buildPaginatedResult,
  normalizePagination,
  getPaginationOffset,
} from '@panda-ng/utils';

interface CreateAuditLogDto {
  actorId: string;
  actorType?: 'ADMIN' | 'SYSTEM' | 'PLAYER';
  action: AdminAction | string;
  resource: string;
  resourceId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto) {
    const entry = await this.prisma.auditLog.create({
      data: {
        actorId: dto.actorId,
        actorType: dto.actorType ?? 'ADMIN',
        action: dto.action as string,
        resource: dto.resource,
        resourceId: dto.resourceId,
        before: dto.before as object,
        after: dto.after as object,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
    });

    this.logger.log(
      `Audit: ${dto.actorId} → ${dto.action} on ${dto.resource}${dto.resourceId ? ':' + dto.resourceId : ''}`,
    );

    return entry;
  }

  async getLogs(
    pagination: { page: number; limit: number },
    filters: {
      actorId?: string;
      action?: string;
      resource?: string;
      from?: Date;
      to?: Date;
    },
  ) {
    const normalized = normalizePagination(pagination);
    const where = {
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.action ? { action: { contains: filters.action } } : {}),
      ...(filters.resource ? { resource: filters.resource } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: getPaginationOffset(normalized),
        take: normalized.limit,
        include: { actor: { select: { username: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return buildPaginatedResult(logs, total, normalized);
  }
}
