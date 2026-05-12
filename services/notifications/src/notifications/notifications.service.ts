import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginatedResult, normalizePagination, getPaginationOffset } from '@panda-ng/utils';
import { NotificationType, NotificationChannel } from '@panda-ng/types';
import type { PushPayload, RegisterPushTokenDto } from '@panda-ng/types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(
    userId: string,
    pagination: { page: number; limit: number; unreadOnly?: boolean },
  ) {
    const normalized = normalizePagination(pagination);
    const where = {
      userId,
      ...(pagination.unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: getPaginationOffset(normalized),
        take: normalized.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return buildPaginatedResult(notifications, total, normalized);
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updatedCount: result.count };
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    channel = NotificationChannel.IN_APP,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, channel, title, body, data, sentAt: new Date() },
    });

    if (channel === NotificationChannel.PUSH) {
      // Stringify all data values — FCM requires Record<string, string>
      const pushData: Record<string, string> = data
        ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
        : {};
      await this.sendPushToUser(userId, { token: '', title, body, data: pushData });
    }

    return notification;
  }

  async registerPushToken(userId: string, dto: RegisterPushTokenDto) {
    return this.prisma.pushToken.upsert({
      where: { token: dto.token },
      create: {
        userId,
        token: dto.token,
        deviceType: dto.deviceType,
        deviceId: dto.deviceId,
        isActive: true,
      },
      update: { userId, isActive: true, updatedAt: new Date() },
    });
  }

  private async sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId, isActive: true },
      select: { token: true },
    });

    await Promise.all(tokens.map(({ token }) => this.sendPush({ ...payload, token })));
  }

  private async sendPush(payload: PushPayload): Promise<void> {
    const firebaseProjectId = process.env['FIREBASE_PROJECT_ID'];
    if (!firebaseProjectId) {
      this.logger.warn('Firebase not configured — skipping push notification');
      return;
    }

    // TODO: Initialize Firebase Admin SDK and send FCM message
    this.logger.debug(`Push notification queued for token: ${payload.token.substring(0, 10)}...`);
  }
}
